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
document.addEventListener('contextmenu', event => event.preventDefault());

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
const viewportOptions = {
    pauseOnBlur: false,
    screenWidth: w,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
}

const viewport = new Viewport(game.stage, viewportOptions)

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

var system
var hud

var socket

var resources

function onLoad(loader, res) {
    resources = res

    const stage = game.stage

    /*
    const orbit1 = game.stage.addChild(new Orbit(0, 0, 150, 25))
    const orbit2 = game.stage.addChild(new Orbit(0, 0, 220, 25))
    const orbit3 = game.stage.addChild(new Orbit(0, 0, 270, 25))
    const orbit4 = game.stage.addChild(new Orbit(0, 0, 360, 25))

    var sun = new PIXI.particles.Emitter(stage, resources.sunTexture.texture, sunParticle)
    sun.emit = true

    const planet1 = new Planet(resources.planet1.texture, orbit1, 0.1, -1 / 4, Math.PI / 2, 2)
    const planet2a = new Planet(resources.planet2.texture, orbit2, 0.1, -1 / 6, 0, 1)
    const planet2b = new Planet(resources.planet2.texture, orbit2, 0.1, -1 / 6, Math.PI, 1)
    const planet3 = new Planet(resources.planet1.texture, orbit3, 0.1, 1 / 3, Math.PI / 4, 1 / 2)
    const planet4 = new Planet(resources.planet2.texture, orbit4, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4)

    var planets = [planet1, planet2a, planet2b, planet3, planet4]
    var drawLines = []
    for (i in planets) {
        drawLines.push(game.stage.addChild(new Line(dashThickness, planets[i].tint)))
    }
    for (i in planets) {
        game.stage.addChild(planets[i])
    }

    for (i in planets) {
        planets[i].tint = 0xFFFFFF
    }

    // Setup for testing the game
    var myPlanets = [planet2a]
    var yourPlanets = [planet2b]
    //planet1.tint = 0xFFCCCC
    planet2a.tint = 0xFFAAAA
    planet2a.outline.tint = planet2a.tint
    planet2b.tint = 0xAAAAFF
    planet2b.outline.tint = planet2b.tint
    //planet3.tint = 0xCCCCFF
    //planet4.tint = 0xFAFACC

    planet2a.createSpawn(true)
    planet2b.createSpawn(true)

    system = new System(sun, planets, drawLines, myPlanets, yourPlanets)
    */

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

    hud = stage.addChild(new Hud())

    pixelText = hud.addChild(new TextButton('Pixels: 0', style, 0, 0, 20, 20))
    shipsText = hud.addChild(new TextButton('Ships: 0', style, 0, 0, 0, 0, pixelText, 0, 1))

    buy10ShipText = hud.addChild(new TextButton('10 Ships (90 pixels)', style, 0.5, 0.5, -100, 0))
    buy10ShipText.anchor.set(1, 0.5)
    buy1ShipText = hud.addChild(new TextButton('1 Ship (10 pixels)', style, 0, 0, 0, 2, buy10ShipText, 0, 1))
    buy1ShipText.anchor.set(1, 0.5)
    buy100ShipText = hud.addChild(new TextButton('100 Ship (800 pixels)', style, 0, 0, 0, -2, buy10ShipText, 0, -1))
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
        var outline = new PIXI.Graphics();
        outline.lineStyle(3, 0xFFFFFF);
        outline.drawRect(-10, -5, createGameText.width + 20, createGameText.height + 10)
        outline.visible = false
        createGameText.addChild(outline)
        createGameText.box = outline
    }

    joinRandomGameText = hud.addChild(new TextButton('With Random Player', style, 0.5, 0.5, -40, -100))
    joinRandomGameText.anchor.set(1, 0)

    {
        var outline = new PIXI.Graphics()
        outline.lineStyle(3, 0xFFFFFF)
        outline.drawRect(-joinRandomGameText.width - 10, -5, joinRandomGameText.width + 20, joinRandomGameText.height + 10)
        outline.visible = false
        joinRandomGameText.addChild(outline)
        joinRandomGameText.box = outline
    }

    joinFriendsGameText = hud.addChild(new TextButton('With a Friend', style, 0.5, 0.5, 40, -100))
    joinFriendsGameText.anchor.set(0, 0)

    {
        var outline = new PIXI.Graphics();
        outline.lineStyle(3, 0xFFFFFF);
        outline.drawRect(-10, -5, joinFriendsGameText.width + 20, joinFriendsGameText.height + 10)
        outline.visible = false
        joinFriendsGameText.addChild(outline)
        joinFriendsGameText.box = outline
    }

    usernameEntry = hud.addChild(new TextButton('Username:', style, 0.5, 0.5, -40, -30))
    usernameEntry.anchor.set(1, 0)

    idEntry = hud.addChild(new TextButton('Game ID:', style, 0.5, 0.5, -40, 40))
    idEntry.anchor.set(1, 0)

    goText = hud.addChild(new TextButton('Start!', largeStyle, 0.5, 0.5, 0, 110))
    goText.anchor.set(0.5, 0)

    sendingFormText = hud.addChild(new TextButton('Please wait while you are connected...', smallStyle, 0.5, 0.5, 0, 170))
    sendingFormText.anchor.set(0.5, 0)

    resize()

    hud.update()

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

function centerView(inter) {
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
        pixels += 5000
        hud.updateText()
    }
    if (PIXI.keyboardManager.isPressed(Key.O)) {
        // removeShips(myPlanet, 10)
        //focusPlanet.removeSpawn(1)
        hud.updateText()
    }

    let screenPoint = game.renderer.plugins.interaction.mouse.global
    if (PIXI.keyboardManager.isPressed(Key.W)) {
        viewport.down(screenPoint.x, screenPoint.y, {
            id: 0
        })
    } else if (PIXI.keyboardManager.isDown(Key.W)) {
        viewport.move(screenPoint.x, screenPoint.y, {
            id: 0
        })
    } else if (PIXI.keyboardManager.isReleased(Key.W)) {
        if (viewport.plugins['drag'] && viewport.plugins['drag'].moved) {

        } else {
            let worldPoint = viewport.toWorld(screenPoint)

            onMouseClick({
                screen: {
                    x: screenPoint.x,
                    y: screenPoint.y
                },
                world: {
                    x: worldPoint.x,
                    y: worldPoint.y
                },
                viewport: viewport
            })
        }

        viewport.up(screenPoint.x, screenPoint.y, {
            id: 0
        })
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

viewport.on('drag-start', function (e) {
    stopSnap()
    stopFollow()
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', onMouseClick)

function onMouseClick(e) {
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

        var point = new PIXI.Point(e.screen.x, e.screen.y)

        if (buy1ShipText.clicked(point)) {
            focusPlanet.createShips(1, 10)
            return
        }

        if (buy10ShipText.clicked(point)) {
            focusPlanet.createShips(10, 90)
            return
        }

        if (buy100ShipText.clicked(point)) {
            focusPlanet.createShips(100, 800)
            return
        }

        if (sendShipText.clicked(point)) {
            goToSendShipsScreen(focusPlanet, 100)
            return
        }

        if (buySpawnText.clicked(point)) {
            focusPlanet.createSpawn()
            return
        }

        var planet = system.getPlanet(e.world.x, e.world.y)
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
        // Spaghetti Main Menu code
        var point = new PIXI.Point(e.screen.x, e.screen.y)

        menuSpaghetti(point)
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
    viewport.resize(width, height)
    viewport.fitHeight(prevHeight, false)

    // Must maintain the center manually instad of using fitHeight's built in one because the
    // center value will change upon resizing the viewport and game window
    if (oldCenter) {
        viewport.moveCenter(oldCenter)
    }

    stopSnap()
    hud.resize(width, height)
}

const shipSpeed = 15 // units per second

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

// Stats
var lastPixels = 1
var pixels = 0
var lastShips = 1
var ships = 0

// Planet vars
var lastFocus = true
var focusPlanet

function gameLoop() {

    updateKeyboard()

    let now = Date.now()
    let elasped = now - lastElapsed
    lastElapsed = now
    let eTime = (elasped * 0.001)

    viewport.update()

    if (system) {
        system.update(eTime)

        if (ships != lastShips) {
            lastShips = ships
            shipsText.text = 'Ships: ' + ships
        }
        if (pixels != lastPixels) {
            lastPixels = pixels
            pixelText.text = 'Pixels: ' + pixels
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

    hud.update()
}

function parse(type, packet) {

    switch (type) {
        case 'formfail':
            failSendForm(packet.reason)
            break
        case 'formpass':
            hud.hideAll()
            document.getElementById('nameInput').style.visibility = 'hidden'
            document.getElementById('idInput').style.visibility = 'hidden'
            break
    }

    console.log('type: ' + type)
    console.log('packet: ' + packet)
}

//  __  __                  
// |  \/  |                 
// | \  / | ___ _ __  _   _ 
// | |\/| |/ _ \ '_ \| | | |
// | |  | |  __/ | | | |_| |
// |_|  |_|\___|_| |_|\__,_|

var connectionAttempts = -1
var connected = false

function connect() {

    connectionText.visible = true

    var ws = socket.connect()

    ws.onerror = function (evt) {
        console.log('The WebSocket experienced an error')
    }

    ws.onclose = function (evt) {
        console.log('The WebSocket was closed [' + evt.code + '] (' + evt.reason + ')')

        //removeGameFeatures()
        connectionAttempts++
        connected = false

        updateStartButton()

        connectionText.visible = true
        couldntReachText.visible = true
        couldntReachText.text = 'Couldn\'t establish connection, retrying... [' + connectionAttempts + ']'

        connect()
    }

    ws.onopen = function (evt) {
        console.log('The WebSocket was opened succesfully!');

        connectionAttempts = -1
        connected = true
        connectionText.visible = false
        couldntReachText.visible = false
        updateStartButton()
    }

    ws.onmessage = function (evt) {
        try {
            // console.log('The WebSocket was messaged [' + evt.origin + '] (' + evt.data + ')')
            var pack = JSON.parse(evt.data)
            parse(pack.type, pack)
        } catch (err) {
            console.log(err)
        }
    }
}

var usernameSelected = false
var flashingInput = 0

function gotoTitle() {
    hud.hideAll()

    joinGameText.visible = true
    joinGameText.box.visible = false
    createGameText.visible = true
    createGameText.box.visible = false

    joinRandomGameText.visible = true
    joinRandomGameText.box.visible = false
    joinRandomGameText.setEnabled(false)
    joinFriendsGameText.visible = true
    joinFriendsGameText.box.visible = false
    joinFriendsGameText.setEnabled(false)

    usernameEntry.visible = true

    document.getElementById('nameInput').style.visibility = 'visible'
    document.getElementById('idInput').style.visibility = 'hidden'

    goText.visible = true
    updateStartButton()
}

function updateStartButton() {
    if ((joinGameText.box.visible || createGameText.box.visible) && (joinRandomGameText.box.visible || joinFriendsGameText.box.visible)) {
        if (/^([A-Za-z0-9]{3,20})$/.test(document.getElementById('nameInput').value)) {
            if (!(joinGameText.box.visible && joinFriendsGameText.box.visible) || /^([A-Za-z0-9]{6})$/.test(document.getElementById('idInput').value)) {
                if (connected) {
                    goText.setEnabled()
                    return true
                }
            }
        }
    }
    goText.setEnabled(false)
    return false
}

document.onkeypress = function keyDownTextField(e) {
    var keyCode = e.keyCode;
    if (keyCode == Key.ENTER && goText.visible) {
        if (updateStartButton()) {
            sendForm()
        }
        return false
    }
}

function failSendForm(message) {
    sendingFormText.text = message
    sendingFormText.visible = true
}

function sendForm() {
    sendingFormText.text = 'Please wait while you are connected...'
    sendingFormText.visible = true

    let isHost = createGameText.box.visible
    let doID = joinFriendsGameText.box.visible && !isHost

    var formPacket = {
        type: 'form',
        host: isHost,
        user: document.getElementById('nameInput').value,
        id: doID ? document.getElementById('idInput').value : ''
    }

    socket.ws.send(JSON.stringify(formPacket))
}

var sendingForm = false

function menuSpaghetti(point) {
    function showJoinGame() {
        var withFriends = isSelected(joinFriendsGameText)
        var withRandom = isSelected(joinRandomGameText)

        gotoTitle()

        joinGameText.box.visible = true
        createGameText.box.visible = false
        joinFriendsGameText.setEnabled(true)
        joinFriendsGameText.box.visible = withFriends
        joinRandomGameText.setEnabled(true)
        joinRandomGameText.box.visible = withRandom

        idEntry.visible = withFriends
        document.getElementById('idInput').style.visibility = withFriends ? 'visible' : 'hidden'

    }

    function isSelected(button) {
        return button.box.visible
    }

    if (joinGameText.clicked(point)) {
        showJoinGame()

    } else if (createGameText.clicked(point)) {
        gotoTitle()
        joinGameText.box.visible = false
        createGameText.box.visible = true
        joinFriendsGameText.setEnabled(true)
        joinFriendsGameText.box.visible = true
    } else if (joinRandomGameText.clicked(point)) {
        joinFriendsGameText.box.visible = false
        joinRandomGameText.box.visible = true
        showJoinGame()
    } else if (isSelected(joinGameText) && joinFriendsGameText.clicked(point)) {
        joinFriendsGameText.box.visible = true
        joinRandomGameText.box.visible = false
        showJoinGame()
    }

    updateStartButton()

    if (goText.clicked(point)) {
        sendForm()
    }
}
