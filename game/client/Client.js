//   _____      _               
//  / ____|    | |              
// | (___   ___| |_ _   _ _ __  
//  \___ \ / _ \ __| | | | '_ \ 
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/ 
//                       | |    
//                       |_|   

const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)

const maxHeight = 1000
const minHeight = 100

// This is variable, used here to initialize things
const h = 600
const w = 600

window.addEventListener('resize', resize)
window.onorientationchange = resize

// Creates the PIXI application
const game = new PIXI.Application(w, h, {
    antialias: true,
    transparent: false
})

// Sets up the element
game.view.style.position = 'absolute'
game.view.style.display = 'block'
document.body.appendChild(game.view)
game.renderer.autoResize = true
game.renderer.backgroundColor = Colour.background
document.addEventListener('contextmenu', event => event.preventDefault())

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
const viewportOptions = {
    screenWidth: w,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
    ticker: game.ticker
}

const viewport = new Viewport(viewportOptions)
game.stage.addChild(viewport)


const clampOptions = {
    minWidth: 1,
    minHeight: minHeight,
    maxWidth: 1000 * w,
    maxHeight: maxHeight
}

const pinchOptions = {
    percent: 4.5
}

viewport
    .drag()
    .wheel()
    .pinch(pinchOptions)
    .clampZoom(clampOptions)
    .decelerate()

/*
var graphics = new PIXI.Graphics()
graphics.beginFill(0xFFFF00)
graphics.lineStyle(5, 0xFF0000)
graphics.drawRect(0, 0, 100, 100)
viewport.addChild(graphics)*/

PIXI.loader
    .add('sunTexture', 'game/assets/sun.png')
    .add('planet1', 'game/assets/planet1.png')
    .add('planet2', 'game/assets/planet2.png')
    .add('ship', 'game/assets/ship.png')
    .add('spawn', 'game/assets/spawn.png')
    .add('infantry', 'game/assets/infantry.png')
    .load(onLoad)

//  _____       _ _   
// |_   _|     (_) |  
//   | |  _ __  _| |_ 
//   | | | '_ \| | __|
//  _| |_| | | | | |_ 
// |_____|_| |_|_|\__|

var myTeam
var system
var teams
var hud

var socket
var ping = 200

var resources

function onLoad(loader, res) {
    resources = res

    lastElapsed = Date.now()
    game.ticker.add(gameLoop)

    viewport.fitHeight(centerHeight)
    viewport.moveCenter(0, 0)

    var style = {
        fontFamily: 'Verdana',
        fontSize: 28,
        fill: Colour.white,
        disabledFill: Colour.greyText
    }

    var smallStyle = {
        fontFamily: 'Verdana',
        fontSize: 18,
        fill: Colour.white,
        disabledFill: Colour.greyText
    }

    var largeStyle = {
        fontFamily: 'Verdana',
        fontSize: 48,
        fill: Colour.white,
        disabledFill: Colour.greyText
    }

    hud = game.stage.addChild(new Hud())

    pixelText = hud.addChild(new TextButton('Pixels: 0', style, 0, 0, 20, 20))
    shipsText = hud.addChild(new TextButton('Ships: 0', style, 0, 0, 0, 0, pixelText, 0, 1))

    pingText = hud.addChild(new TextButton('Ping: 200ms', smallStyle, 1, 0, -10, 10))
    pingText.anchor.set(1, 0)
    playersText = hud.addChild(new TextButton('Players: (0/0)', smallStyle, 1, 0, -10, 30))
    playersText.anchor.set(1, 0)

    buy10ShipText = hud.addChild(new TextButton('10 Ships (90 pixels)', style, 0.5, 0.5, -100, 0))
    buy10ShipText.anchor.set(1, 0.5)
    buy1ShipText = hud.addChild(new TextButton('1 Ship (10 pixels)', style, 0, 0, 0, 2, buy10ShipText, 0, 1))
    buy1ShipText.anchor.set(1, 0.5)
    buy100ShipText = hud.addChild(new TextButton('100 Ships (800 pixels)', style, 0, 0, 0, -2, buy10ShipText, 0, -1))
    buy100ShipText.anchor.set(1, 0.5)

    buySpawnText = hud.addChild(new TextButton('1 Spawn (1000 pixels)', style, 0.5, 0.5, 0, -100))
    buySpawnText.anchor.set(0.5, 1)

    sendShipText = hud.addChild(new TextButton('Send Ships (100 ships)', style, 0.5, 0.5, 100, 0))
    sendShipText.anchor.set(0, 0.5)

    // The menu texts

    connectionText = hud.addChild(new TextButton('Connecting to Server...', style, 0.5, 0.5, 0, -250))
    connectionText.anchor.set(0.5, 0.5)

    couldntReachText = hud.addChild(new TextButton('Couldn\'t establish connection, retrying... []', smallStyle, 0.5, 0.5, 0, -220))
    couldntReachText.anchor.set(0.5, 0.5)
    couldntReachText.visible = false

    joinGameText = hud.addChild(new TextButton('Join Game', style, 0.5, 0.5, -40, -170))
    joinGameText.anchor.set(1, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-joinGameText.width - 10, -5, joinGameText.width + 20, joinGameText.height + 10)
        outline.visible = false
        joinGameText.addChild(outline)
        joinGameText.box = outline
    }

    createGameText = hud.addChild(new TextButton('Create Game', style, 0.5, 0.5, 40, -170))
    createGameText.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, createGameText.width + 20, createGameText.height + 10)
        outline.visible = false
        createGameText.addChild(outline)
        createGameText.box = outline
    }

    joinRandomGameText = hud.addChild(new TextButton('Random Game', style, 0.5, 0.5, -40, -100))
    joinRandomGameText.anchor.set(1, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-joinRandomGameText.width - 10, -5, joinRandomGameText.width + 20, joinRandomGameText.height + 10)
        outline.visible = false
        joinRandomGameText.addChild(outline)
        joinRandomGameText.box = outline
    }

    joinFriendsGameText = hud.addChild(new TextButton('With Friends', style, 0.5, 0.5, 45, -100))
    joinFriendsGameText.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, joinFriendsGameText.width + 20, joinFriendsGameText.height + 10)
        outline.visible = false
        joinFriendsGameText.addChild(outline)
        joinFriendsGameText.box = outline
    }

    usernameEntry = hud.addChild(new TextButton('Username:', style, 0.5, 0.5, -40, -30))
    usernameEntry.anchor.set(1, 0)

    idEntry = hud.addChild(new TextButton('Game ID:', style, 0.5, 0.5, -40, 40))
    idEntry.anchor.set(1, 0)

    playerCount = hud.addChild(new TextButton('Player Count:', style, 0.5, 0.5, -40, 40))
    playerCount.anchor.set(1, 0)

    playerCount2 = hud.addChild(new TextButton('2', style, 0.5, 0.5, 10, 40))
    playerCount2.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount2.width + 20, playerCount2.height + 10)
        outline.visible = false
        playerCount2.addChild(outline)
        playerCount2.box = outline
    }

    playerCount3 = hud.addChild(new TextButton('3', style, 0.5, 0.5, 40, 40))
    playerCount3.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount3.width + 20, playerCount3.height + 10)
        outline.visible = false
        playerCount3.addChild(outline)
        playerCount3.box = outline
    }

    playerCount4 = hud.addChild(new TextButton('4', style, 0.5, 0.5, 70, 40))
    playerCount4.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount4.width + 20, playerCount4.height + 10)
        outline.visible = false
        playerCount4.addChild(outline)
        playerCount4.box = outline
    }

    playerCount5 = hud.addChild(new TextButton('5', style, 0.5, 0.5, 100, 40))
    playerCount5.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount5.width + 20, playerCount5.height + 10)
        outline.visible = false
        playerCount5.addChild(outline)
        playerCount5.box = outline
    }

    playerCount8 = hud.addChild(new TextButton('8', style, 0.5, 0.5, 130, 40))
    playerCount8.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount8.width + 20, playerCount8.height + 10)
        outline.visible = false
        playerCount8.addChild(outline)
        playerCount8.box = outline
    }

    playerCount10 = hud.addChild(new TextButton('10', style, 0.5, 0.5, 160, 40))
    playerCount10.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCount10.width + 20, playerCount10.height + 10)
        outline.visible = false
        playerCount10.addChild(outline)
        playerCount10.box = outline
    }

    playerCountAny = hud.addChild(new TextButton('Any', style, 0.5, 0.5, 210, 40))
    playerCountAny.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-10, -5, playerCountAny.width + 20, playerCountAny.height + 10)
        outline.visible = false
        playerCountAny.addChild(outline)
        playerCountAny.box = outline
    }

    goText = hud.addChild(new TextButton('Start!', largeStyle, 0.5, 0.5, 0, 110))
    goText.anchor.set(0.5, 0)

    sendingFormText = hud.addChild(new TextButton('Please wait while you are connected...', smallStyle, 0.5, 0.5, 0, 170))
    sendingFormText.anchor.set(0.5, 0)

    quitText = hud.addChild(new TextButton('Quit Game', style, 0.5, 0.5, 0, 220))
    quitText.anchor.set(0.5, 0)

    // All the team texts

    redTeamText = hud.addChild(new TextButton('Red', style, 0.5, 0.5, -300, -160))
    redTeamText.anchor.set(0.5, 0)
    redTeamText.tint = Colour.red
    redPlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, -300, -120))
    redPlayersText.anchor.set(0.5, 0)

    purpleTeamText = hud.addChild(new TextButton('Purple', style, 0.5, 0.5, -180, -160))
    purpleTeamText.anchor.set(0.5, 0)
    purpleTeamText.tint = Colour.purple
    purplePlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, -180, -120))
    purplePlayersText.anchor.set(0.5, 0)

    blueTeamText = hud.addChild(new TextButton('Blue', style, 0.5, 0.5, -60, -160))
    blueTeamText.anchor.set(0.5, 0)
    blueTeamText.tint = Colour.blue
    bluePlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, -60, -120))
    bluePlayersText.anchor.set(0.5, 0)

    greenTeamText = hud.addChild(new TextButton('Green', style, 0.5, 0.5, 60, -160))
    greenTeamText.anchor.set(0.5, 0)
    greenTeamText.tint = Colour.green
    greenPlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, 60, -120))
    greenPlayersText.anchor.set(0.5, 0)

    yellowTeamText = hud.addChild(new TextButton('Yellow', style, 0.5, 0.5, 180, -160))
    yellowTeamText.anchor.set(0.5, 0)
    yellowTeamText.tint = Colour.yellow
    yellowPlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, 180, -120))
    yellowPlayersText.anchor.set(0.5, 0)

    orangeTeamText = hud.addChild(new TextButton('Orange', style, 0.5, 0.5, 300, -160))
    orangeTeamText.anchor.set(0.5, 0)
    orangeTeamText.tint = Colour.orange
    orangePlayersText = hud.addChild(new TextButton('', style, 0.5, 0.5, 300, -120))
    orangePlayersText.anchor.set(0.5, 0)

    resize()

    socket = new SocketManager()

    gotoTitle()
    connect()
}

//  _____                   _   
// |_   _|                 | |  
//   | |  _ __  _ __  _   _| |_ 
//   | | | '_ \| '_ \| | | | __|
//  _| |_| | | | |_) | |_| | |_ 
// |_____|_| |_| .__/ \__,_|\__|
//             | |              
//             |_|              

const sunClickRadiusSqr = 100 * 100

// The animation time (in milliseconds) for zooming, panning, etc.
const animTime = 300
// The height of the viewport after zooming on a planet
const zoomHeight = 250
// The height of the viewport after zooming back out to the sun
const centerHeight = 800
var snappingToPlanet = false
var snappingToCenter = false

function stopSnap() {
    snappingToPlanet = false
    snappingToCenter = false
    viewport.removePlugin('snap')
    viewport.removePlugin('snap-zoom')
}

function stopFollow() {
    viewport.removePlugin('follow')
    focusPlanet = null
}

function centerView() {
    if (!snappingToCenter) {
        stopSnap()
        snappingToCenter = true
        stopFollow()
        viewport.snap(0, 0, {
            time: animTime,
            removeOnComplete: true,
            center: true,
            ease: 'easeInOutSine'
        })

        viewport.snapZoom({
            height: centerHeight,
            time: animTime,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutQuart'
        })
    }
}

function updateKeyboard() {

    if (PIXI.keyboardManager.isPressed(Key.P)) {
        myTeam.pixels += 5000000000000000000000
        hud.updateText()
    }
    if (PIXI.keyboardManager.isPressed(Key.O)) {

    }
    if (PIXI.keyboardManager.isPressed(Key.L)) {

    }

    let screenPoint = game.renderer.plugins.interaction.mouse.global
    if (PIXI.keyboardManager.isPressed(Key.W)) {
        /* TODO
        viewport.down(screenPoint.x, screenPoint.y, {
            id: 0
        })*/
    } else if (PIXI.keyboardManager.isDown(Key.W)) {
        /* TODO
        viewport.move(screenPoint.x, screenPoint.y, {
            id: 0
        })*/
    } else if (PIXI.keyboardManager.isReleased(Key.W)) {
        if (viewport.plugins['drag'] && viewport.plugins['drag'].moved) {

        } else {
            onMouseClick({
                data: {
                    global: {
                        x: screenPoint.x,
                        y: screenPoint.y
                    }
                }
            })
        }

        /* TODO
        viewport.up(screenPoint.x, screenPoint.y, {
            id: 0
        })*/
    }

    if (PIXI.keyboardManager.isPressed(Key.ESCAPE) || PIXI.keyboardManager.isPressed(Key.A) || PIXI.keyboardManager.isPressed(Key.D) || PIXI.keyboardManager.isPressed(Key.SPACE)) {

        if (isChoosingShipSend()) {
            cancelSendShips()
        } else {
            centerView()
        }
    }

    PIXI.keyboardManager.update()
}

// Quick hack while dragging error persists:
// Click event fires after drag
var dragging = false
viewport.on('drag-start', function (e) {
    stopSnap()
    stopFollow()
    dragging = true
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', handleClick)
viewport.on('tap', handleClick)

function handleClick(e) {
    if (!dragging) {
        onMouseClick(e)
    } else {
        dragging = false
    }
}

function onMouseClick(e) {
    let screen = e.data.global
    let world = viewport.toWorld(screen)

    var point = new PIXI.Point(screen.x, screen.y)

    if (system) {
        if (isChoosingShipSend()) {
            // updateSelectedPlanet(e.world.x, e.world.y)

            if (selectedPlanet) {
                sendShipsFrom.sendShipsTo(selectedPlanet, sendShipsAmount)
            }
            cancelSendShips()

            return
        }

        stopSnap()


        if (buy1ShipText.clicked(point)) {
            focusPlanet.createShipsClick(1, 10)
            return
        }

        if (buy10ShipText.clicked(point)) {
            focusPlanet.createShipsClick(10, 90)
            return
        }

        if (buy100ShipText.clicked(point)) {
            focusPlanet.createShipsClick(100, 800)
            return
        }

        if (sendShipText.clicked(point)) {
            goToSendShipsScreen(focusPlanet, 100)
            return
        }

        if (buySpawnText.clicked(point)) {
            focusPlanet.createSpawnClick()
            return
        }

        var planet = system.getPlanet(world.x, world.y)
        if (planet) {
            // If the viewport is already following the planet that was clicked on, then don't do anything
            var follow = viewport.plugins['follow']
            if (follow && (follow.target == planet)) {
                // Do the zoom if holding shift
                if (PIXI.keyboardManager.isDown(Key.SHIFT)) {
                    viewport.snapZoom({
                        height: centerHeight,
                        time: animTime,
                        removeOnComplete: true,
                        ease: 'easeInOutSine'
                    })
                } else {
                    viewport.snapZoom({
                        height: zoomHeight,
                        time: animTime,
                        removeOnComplete: true,
                        ease: 'easeInOutSine'
                    })
                }

                return
            }

            snappingToPlanet = planet

            // The calculated future positions of the planet
            var pos = planet.calcPosition(animTime / 1000)

            // Snap to that position
            viewport.snap(pos.x, pos.y, {
                time: animTime,
                removeOnComplete: true,
                ease: 'easeOutQuart'
            })

            // Do the zoom if not holding shift
            if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
                viewport.snapZoom({
                    height: zoomHeight,
                    time: animTime,
                    removeOnComplete: true,
                    ease: 'easeInOutSine'
                })
            }

            return
        }

        // If nothing was clicked on, remove the follow plugin
        stopFollow()
        centerView()
    } else {
        if (inTeamSelection()) {
            if (redTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 0
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (purpleTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 1
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (blueTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 2
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (greenTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 3
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (yellowTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 4
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (orangeTeamText.clicked(point)) {
                var pack = {
                    type: 'jointeam',
                    team: 5
                }
                socket.ws.send(JSON.stringify(pack))
                return
            }
            if (goText.clicked(point)) {
                var pack = {
                    type: 'start'
                }
                socket.ws.send(JSON.stringify(pack))
                goText.setEnabled(false)
                return
            }
            if (quitText.clicked(point)) {
                var pack = {
                    type: 'quit'
                }
                socket.ws.send(JSON.stringify(pack))
                gotoTitle()
                return
            }
        } else {
            // Spaghetti Main Menu code
            menuSpaghetti(point)
        }
    }
}

// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
viewport.on('snap-end', function () {
    if (snappingToPlanet) {
        viewport.follow(snappingToPlanet)
        focusPlanet = snappingToPlanet
    }
    stopSnap()
})

//  _    _ _   _ _ 
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

function resize() {
    window.scrollTo(0, 0)

    var oldCenter
    if (viewport.center) {
        oldCenter = viewport.center
    }

    var prevHeight = viewport.worldScreenHeight

    var width = window.innerWidth
    var height = window.innerHeight
    var ratio = height / h

    game.renderer.resize(width, height)
    viewport.resize(width, height, width, height)
    viewport.fitHeight(prevHeight, false)

    // Must maintain the center manually instad of using fitHeight's built in one because the
    // center value will change upon resizing the viewport and game window
    if (oldCenter) {
        viewport.moveCenter(oldCenter)
    }

    stopSnap()
    hud.resize(width, height)
}

function getTeam(id) {
    for (var i in this.teams) {
        if (this.teams[i].id == id) {
            return this.teams[i]
        }
    }
    return null
}

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

// Stats
var lastPixels = 1
var lastShips = 1

// Planet vars
var lastFocus = true
var focusPlanet

function gameLoop() {

    updateKeyboard()

    let now = Date.now()
    let elapsed = now - lastElapsed
    lastElapsed = now
    let eTime = (elapsed * 0.001)

    if (system) {
        system.update(eTime)

        if (myTeam.shipCount != lastShips) {
            lastShips = myTeam.shipCount
            shipsText.text = 'Ships: ' + myTeam.shipCount
        }

        // TODO this can be done in parse() when the server sends new pixels
        if (myTeam.pixels != lastPixels) {
            lastPixels = myTeam.pixels
            pixelText.text = 'Pixels: ' + myTeam.pixels
        }

        var focussed = focusPlanet && focusPlanet.isMyPlanet()

        if (focussed != lastFocus) {
            lastFocus = focussed

            buy1ShipText.visible = focussed
            buy10ShipText.visible = focussed
            buy100ShipText.visible = focussed
            sendShipText.visible = focussed
            buySpawnText.visible = focussed
        }
        if (focussed) {
            hud.updateText()
        }
    }
}

var gameID = null
var player = 0

function inTeamSelection() {
    return redTeamText.visible
}

function parse(type, pack) {
    switch (type) {
        case 'p':
            let pPack = {
                type: 'p'
            }
            socket.ws.send(JSON.stringify(pPack))
            break
        case 'pi':
            pingText.visible = true
            ping = pack.ping
            pingText.text = 'Ping: ' + ping + 'ms'
            break
        case 'pix': // update pixel count
            var pl = pack.pl
            myTeam.pixels = pl
            break
        case 'bs': // buy ships
            system.getPlanetByID(pack.pl).createShips(pack.n)
            break
        case 'formfail':
            failSendForm(pack.reason)
            break
        case 'joingame':
            hud.hideAll()
            document.getElementById('nameInput').style.visibility = 'hidden'
            document.getElementById('idInput').style.visibility = 'hidden'
            document.getElementById('nameCheck').style.visibility = 'hidden'
            document.getElementById('nameCross').style.visibility = 'hidden'
            document.getElementById('idCheck').style.visibility = 'hidden'
            document.getElementById('idCross').style.visibility = 'hidden'

            gameID = pack.gameID
            player = pack.player

            teams = []
            myTeam = null

            goText.visible = true
            quitText.visible = true

            document.getElementById('gameID').style.visibility = 'visible'
            document.getElementById('gameID').innerHTML = 'Game ID: ' + gameID

            redTeamText.visible = true
            purpleTeamText.visible = true
            blueTeamText.visible = true
            greenTeamText.visible = true
            yellowTeamText.visible = true
            orangeTeamText.visible = true

            redPlayersText.visible = true
            purplePlayersText.visible = true
            bluePlayersText.visible = true
            greenPlayersText.visible = true
            yellowPlayersText.visible = true
            orangePlayersText.visible = true

            break
        case 'createsystem':
            system = new System()
            break
        case 'createorbit':
            var orbit = new Orbit(pack.x, pack.y, pack.radius)
            orbit.id = pack.id
            system.addOrbit(orbit)
            break
        case 'createplanet':
            var planet = new Planet(resources.planet1.texture, pack.scale, pack.rotationConstant, pack.startAngle, pack.opm)
            planet.id = pack.id
            system.addPlanet(planet)
            break
        case 'setorbit':
            var planet = system.getPlanetByID(pack.planet)
            var orbit = system.getOrbit(pack.orbit)
            planet.setOrbit(orbit)
            break
        case 'createspawn':
            var planet = system.getPlanetByID(pack.planet)

            // 1. subtract the counter that has happened while this packet sent
            // 2. update the spawn counter by creating a spawn
            // 3. push the spawn counter forward by the new rate
            planet.spawnCounter -= planet.spawnRate * ping
            planet.createSpawn(pack.force)
            planet.spawnCounter += planet.spawnRate * ping
            break
        case 'createteam':
            teams.push(new Team(pack.colour, pack.id))
            break
        case 'setteam':
            var planet = system.getPlanetByID(pack.planet)
            var team = getTeam(pack.team)
            planet.setTeam(team)
            break
        case 'setmyteam':
            myTeam = getTeam(pack.team)

            if (waitingMessage) {
                sendingFormText.text = waitingMessage
                waitingMessage = null
            }
            break
        case 'startgame':
            viewport.addChild(system)
            document.getElementById('gameID').style.visibility = 'hidden'
            hud.hideAll()
            pingText.visible = true
            pixelText.visible = true
            shipsText.visible = true

            break
        case 'start':
            var started = pack.chosen
            var total = pack.total

            if (goText.enabled) {
                sendingFormText.text = 'Press Start to confirm teams! (' + started + '/' + total + ')'
            } else {
                let starting = total - started
                sendingFormText.text = 'Waiting for ' + starting + ' player' + (starting != 1 ? 's' : '') + ' to confirm teams... (' + started + '/' + total + ')'
            }

            break
        case 'popteam':
            var team = getTeam(pack.team)
            var name = pack.name

            switch (pack.team) {
                case 0:
                    redPlayersText.text += name + '\n'
                    break
                case 1:
                    purplePlayersText.text += name + '\n'
                    break
                case 2:
                    bluePlayersText.text += name + '\n'
                    break
                case 3:
                    greenPlayersText.text += name + '\n'
                    break
                case 4:
                    yellowPlayersText.text += name + '\n'
                    break
                case 5:
                    orangePlayersText.text += name + '\n'
                    break
            }

            team.addPlayer(new Player(name))

            break;
        case 'clearteams':
            teams = []
            break
        case 'clearteamplayers':
            for (var i in teams) {
                teams[i].players = []
            }
            redPlayersText.text = ''
            purplePlayersText.text = ''
            bluePlayersText.text = ''
            greenPlayersText.text = ''
            yellowPlayersText.text = ''
            orangePlayersText.text = ''
            break
        case 'updateplayers':
            var chosen = pack.chosen
            var total = pack.total
            var max = pack.max

            playersText.visible = true
            playersText.text = 'Players: (' + total + '/' + max + ')'

            goText.setEnabled(false)
            sendingFormText.visible = true

            if (total >= 2) {
                if (chosen == total) {
                    // Double checks to make sure that more than one team is populated populated
                    var populatedTeams = 0
                    for (var i in teams) {
                        if (teams[i].players.length > 0) {
                            populatedTeams++
                        }
                    }

                    if (populatedTeams > 1) {
                        goText.setEnabled(true)
                        sendingFormText.text = 'Press Start to confirm teams! (0/' + total + ')'
                    } else {
                        sendingFormText.text = 'More than one team must be populated'
                    }
                } else {
                    var choosing = total - chosen
                    sendingFormText.text = 'Waiting for ' + choosing + ' player' + (choosing != 1 ? 's' : '') + ' to choose a team'
                }
            } else {
                sendingFormText.text = 'Waiting for one or more players to join...'
            }

            // If a team hasn't been chosen yet, display a choose team message
            if (!myTeam) {
                waitingMessage = sendingFormText.text

                sendingFormText.text = 'Click a colour above to join that team!'
            }
            break
    }

    //console.log('type: ' + type)
    //console.log('pack: ' + pack)
}
