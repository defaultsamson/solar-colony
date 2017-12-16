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

var resources

function onLoad(loader, res) {
    resources = res

    const stage = game.stage

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

    lastElapsed = Date.now()
    game.ticker.add(gameLoop)

    viewport.fitHeight(centerHeight)
    viewport.moveCenter(0, 0)

    var style = {
        fontFamily: 'Verdana',
        fontSize: 28,
        fill: Colour.white,
        disabledFill: Colour.greyText
    };

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

    resize()

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
        focusPlanet.removeSpawn(1)
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

    system.update(eTime)

    viewport.update()

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

    hud.update()
}