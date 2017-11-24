//   _____      _               
//  / ____|    | |              
// | (___   ___| |_ _   _ _ __  
//  \___ \ / _ \ __| | | | '_ \ 
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/ 
//                       | |    
//                       |_|   

class Line extends PIXI.Graphics {
    constructor(lineSize, lineColor) {
        super()

        this.l_width = lineSize || 5
        this.l_colour = lineColor || "0x000000"
    }

    setPoints(points) {
        this.clear()
        this.lineStyle(this.l_width, this.l_colour)

        this.moveTo(points[0], points[1])
        this.lineTo(points[2], points[3])
    }
}

class Ship extends Object {
    constructor(fromX, fromY, toX, toY, speed, amount, tint, planet, duration) {
        super()

        this.sprite = game.stage.addChild(new PIXI.Sprite(shipTexture))
        this.sprite.pivot.set(0.5, 0.5)
        this.sprite.anchor.set(0.5, 0.5)
        this.sprite.position.set(fromX, fromY)
        this.sprite.tint = tint

        this.amount = amount
        this.planet = planet
        this.duration = duration
        this.cumulativeDuration = 0

        this.fromX = fromX
        this.fromY = fromY
        this.toX = toX
        this.toY = toY
        this.speed = speed
        let dX = toX - fromX
        let dY = toY - fromY
        let dnet = Math.sqrt(dX * dX + dY * dY)
        this.vX = dX * speed / dnet
        this.vY = dY * speed / dnet

        this.sprite.rotation = (this.vX > 0 ? 1 : -1) * (Math.PI / 2 + Math.asin(this.vY / speed))
    }

    update(delta) {
        this.cumulativeDuration += delta
        if (this.cumulativeDuration >= this.duration) {
            this.arrive()
        } else {
            this.sprite.position.x += this.vX * delta
            this.sprite.position.y += this.vY * delta
        }
    }

    arrive() {
        game.stage.removeChild(this.sprite)
    }
}

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
    .load(onLoad)

//  _____       _ _   
// |_   _|     (_) |  
//   | |  _ __  _| |_ 
//   | | | '_ \| | __|
//  _| |_| | | | | |_ 
// |_____|_| |_|_|\__|

const hudMargin = 20
const textSize = 30

var planets
var sun

var hud

var shipTexture

function onLoad(loader, resources) {

    const stage = game.stage

    const orbit1 = game.stage.addChild(createOrbit(0, 0, 150, 25))
    const orbit2 = game.stage.addChild(createOrbit(0, 0, 220, 25))
    const orbit3 = game.stage.addChild(createOrbit(0, 0, 270, 25))
    const orbit4 = game.stage.addChild(createOrbit(0, 0, 360, 25))

    sun = new PIXI.particles.Emitter(stage, resources.sunTexture.texture, sunParticle)
    sun.emit = true

    const planet1 = createPlanet(resources.planet1.texture, orbit1, 0.1, -1 / 4, Math.PI / 2, 2)
    const planet2a = createPlanet(resources.planet2.texture, orbit2, 0.1, -1 / 6, 0, 1)
    const planet2b = createPlanet(resources.planet2.texture, orbit2, 0.1, -1 / 6, Math.PI, 1)
    const planet3 = createPlanet(resources.planet1.texture, orbit3, 0.1, 1 / 3, Math.PI / 4, 1 / 2)
    const planet4 = createPlanet(resources.planet2.texture, orbit4, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4)

    planets = [planet1, planet2a, planet2b, planet3, planet4]
    drawLines = []
    for (i in planets) {
        drawLines.push(game.stage.addChild(new Line(dashThickness, planets[i].tint)))
    }
    for (i in planets) {
        game.stage.addChild(planets[i])
    }
    sendingShips = []

    lastElapsed = Date.now()
    game.ticker.add(gameLoop)

    viewport.fitHeight(centerHeight)
    viewport.moveCenter(0, 0)

    hud = new PIXI.Container()
    stage.addChild(hud)

    var style = {
        fontFamily: 'Verdana',
        fontSize: textSize,
        fill: Colour.dark10
    };

    pixelText = new PIXI.Text('Pixels: 0', style)
    hud.addChild(pixelText)

    shipsText = new PIXI.Text('Ships: 0', style)
    hud.addChild(shipsText)

    buy1ShipText = new PIXI.Text('1 Ship (10 pixels)', style)
    hud.addChild(buy1ShipText)
    buy10ShipText = new PIXI.Text('10 Ship (90 pixels)', style)
    hud.addChild(buy10ShipText)
    buy100ShipText = new PIXI.Text('100 Ship (800 pixels)', style)
    hud.addChild(buy100ShipText)

    sendShipText = new PIXI.Text('Send Ships (100 ships)', style)
    hud.addChild(sendShipText)

    shipTexture = resources.ship.texture

    resize()

    for (i in planets) {
        planets[i].tint = 0xFFFFFF
    }

    // Setup for testing the game
    myPlanet = planet2a
    //planet1.tint = 0xFFCCCC
    planet2a.tint = 0xFFAAAA
    planet2a.outline.tint = planet2a.tint
    planet2b.tint = 0xAAAAFF
    planet2b.outline.tint = planet2b.tint
    //planet3.tint = 0xCCCCFF
    //planet4.tint = 0xFAFACC
}

//  _____                   _   
// |_   _|                 | |  
//   | |  _ __  _ __  _   _| |_ 
//   | | | '_ \| '_ \| | | | __|
//  _| |_| | | | |_) | |_| | |_ 
// |_____|_| |_| .__/ \__,_|\__|
//             | |              
//             |_|              

const animTime = 300
const zoomHeight = 250
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
    }
    if (PIXI.keyboardManager.isPressed(Key.O)) {
        removeShips(myPlanet, 10)
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

        if (isSendingShips()) {
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
    if (isSendingShips()) {

        if (selectedPlanet) {
            let duration = timeToFastestIntersect(drawLinesFrom, selectedPlanet)
            var pos = calcPlanetPosition(selectedPlanet, duration)
            // console.log('closest intersect: (' + pos.x + ', ' + pos.y + ')')
            sendShips(drawLinesFrom, pos.x, pos.y, selectedPlanet, sendShipsAmount, duration)
            cancelSendShips()
        } else {
            cancelSendShips()
        }

        return
    }

    stopSnap()

    var point = new PIXI.Point(e.screen.x, e.screen.y)

    if (buy1ShipText.visible && buy1ShipText.containsPoint(point)) {
        createShips(myPlanet, 1, 10)
        return
    }

    if (buy10ShipText.visible && buy10ShipText.containsPoint(point)) {
        createShips(myPlanet, 10, 90)
        return
    }

    if (buy100ShipText.visible && buy100ShipText.containsPoint(point)) {
        createShips(myPlanet, 100, 800)
        return
    }

    if (sendShipText.visible && sendShipText.containsPoint(point)) {
        goToSendShipsScreen(myPlanet, 100)
        return
    }

    var planet = getPlanet(e.world.x, e.world.y)
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
        var pos = calcPlanetPosition(planet, (animTime / 1000))

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

    } else {
        // If nothing was clicked on, remove the follow plugin
        stopFollow()

        if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
            centerView()
            return
        }

        const sunRadiusSqr = 100 * 100

        if (distSqr(e.world.x, e.world.y, 0, 0) < sunRadiusSqr) {
            centerView()
        }
    }
}

// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
viewport.on('snap-end', function () {
    if (snappingToPlanet) {
        viewport.follow(snappingToPlanet)
        focusPlanet = snappingToPlanet
        snappingToPlanet = false
    }
    snappingToCenter = false
})

//   _____                _       
//  / ____|              | |      
// | |     _ __ ___  __ _| |_ ___ 
// | |    | '__/ _ \/ _` | __/ _ \
// | |____| | |  __/ (_| | ||  __/
//  \_____|_|  \___|\__,_|\__\___|

const minDashes = 2
const dashThickness = 1.4

// The max number of ships to display in storage per planet
const maxShips = 100

function createOrbit(x, y, radius, dashLength) {

    var numOfDashes = Math.max(Math.floor(Math.PI * radius / dashLength), minDashes)
    var dashRadians = dashLength / radius
    var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

    var pixiCircle = new PIXI.Graphics()
    pixiCircle.radius = radius

    // If it's a full circle, draw it full (more optimised)
    if (spacingRadians <= 0) {
        pixiCircle.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
        pixiCircle.arc(x, y, radius, 0, 2 * Math.PI)
    } else { // Else, draw it dashed
        for (i = 0; i < numOfDashes; i++) {
            var start = i * (dashRadians + spacingRadians)
            var end1 = start + dashRadians
            var end2 = end1 + spacingRadians
            pixiCircle.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
            pixiCircle.arc(x, y, radius, start, end1)
            pixiCircle.lineStyle(dashThickness, Colour.background, 0)
            pixiCircle.arc(x, y, radius, end1, end2)
        }
    }

    // disgusting
    // pixiCircle.cacheAsBitmap = true

    return pixiCircle
}

function createPlanet(texture, orbit, scale, rotationConstant, startAngle, opm) {
    var planet = new PIXI.Sprite(texture)
    planet.radius = 0.5 * planet.width
    planet.orbit = orbit
    planet.pivot.set(planet.radius, planet.radius)

    // Selection ring
    var ring = new PIXI.Graphics()
    ring.lineStyle(dashThickness * 46, Colour.dark8)
    ring.arc(planet.radius, planet.radius, planet.radius * 3, 0, 7)
    ring.visible = false
    planet.outline = planet.addChild(ring)

    // Set the scale
    planet.scale.set(scale)
    planet.radius = planet.radius * planet.scale.x

    // orbits per minute
    planet.opm = opm

    // Ghosting ring
    var ghost = new PIXI.Graphics()
    ghost.lineStyle(dashThickness * 2, Colour.dark8)
    ghost.arc(planet.radius, planet.radius, planet.radius, 0, 7)
    ghost.visible = true
    ghost.pivot.set(planet.radius, planet.radius)
    planet.ghost = game.stage.addChild(ghost)

    // The rotation speed in radians/second
    planet.speed = opm * (1 / 60) * 2 * Math.PI
    planet.rotationConstant = rotationConstant
    planet.ships = []
    planet.age = startAngle / planet.speed
    return planet
}

function createShips(planet, n, cost) {
    if (pixels >= cost) {
        pixels -= cost
        for (var i = 0; i < n; i++) {
            if (ships < maxShips) {
                var ship = new PIXI.Sprite(shipTexture)

                // The position on the planet's surface to place the ship (the angle)
                // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
                let angle = Math.PI * 2 * Math.random()

                let distFromPlanet = 60

                // hypotenuse, opposite, adjacent
                let h = planet.radius / planet.scale.x + distFromPlanet
                let o = h * Math.sin(angle)
                let a = h * Math.cos(angle)
                let x = a + planet.radius / planet.scale.x
                let y = o + planet.radius / planet.scale.x

                ship.tint = planet.tint
                ship.pivot.set(0.5, 0.5)
                ship.position.set(x, y)
                ship.rotation = angle + (Math.PI / 2)
                planet.addChild(ship)
                planet.ships.push(ship)
            }
            ships++
        }
    }
}

function removeShips(planet, n) {

    var visualsToRemove = Math.min(n, Math.max(0, maxShips - ships + n))

    if (visualsToRemove > 0) {
        // Removes the ships from the world
        for (var i = 0; i < visualsToRemove && i < planet.ships.length; i++) {
            planet.removeChild(planet.ships[i])
        }

        // Removes the ships from the array
        planet.ships.splice(0, visualsToRemove)
    }

    ships = Math.max(0, ships - n)
}

//  _    _ _   _ _ 
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40

function getPlanet(x, y) {
    for (var i in planets) {
        let clickThresh = (planets[i].radius + clickThreshold)
        if (distSqr(x, y, planets[i].x, planets[i].y) < clickThresh * clickThresh) {
            return planets[i]
        }
    }

    return null
}

function distSqr(x1, y1, x2, y2) {
    let x = (x2 - x1)
    let y = (y2 - y1)
    return (x * x) + (y * y)
}

function exists(n) {
    return typeof n !== 'undefined' && n !== null
}

function calcPlanetPosition(planet, additionalAge) {
    if (!additionalAge)
        additionalAge = 0

    let radius = planet.orbit.radius
    let age = planet.age + additionalAge
    let x = Math.cos(age * planet.speed) * radius
    let y = Math.sin(age * planet.speed) * radius
    return {
        x: x,
        y: y
    }
}

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
    resizeHud(width, height)
}

function updateHud() {
    hud.position.copy(viewport.toWorld(0, 0))
    hud.scale.set(1 / game.stage.scale.x)
}

function resizeHud(width, height) {
    pixelText.position.set(hudMargin, hudMargin)
    shipsText.position.set(hudMargin, hudMargin + pixelText.height + 2)

    buy1ShipText.position.set(width / 2 - buy1ShipText.width - 100, (height - buy1ShipText.height) / 2 + buy10ShipText.height + 2)
    buy10ShipText.position.set(width / 2 - buy10ShipText.width - 100, (height - buy10ShipText.height) / 2)
    buy100ShipText.position.set(width / 2 - buy100ShipText.width - 100, (height - buy100ShipText.height) / 2 - buy10ShipText.height - 2)

    sendShipText.position.set(width / 2 + 100, (height - buy10ShipText.height) / 2)
}

var drawLinesFrom
var drawLines

function goToSendShipsScreen(fromPlanet, amount) {
    updateLines = ticksPerCollideUpdate
    drawLinesFrom = fromPlanet
    sendShipsAmount = amount
    viewport.pausePlugin('drag')
    viewport.pausePlugin('wheel')
    centerView()
}

function cancelSendShips() {
    for (i in drawLines) {
        drawLines[i].visible = false
    }
    for (i in planets) {
        planets[i].outline.visible = false
        planets[i].ghost.visible = false
    }
    drawLinesFrom = null
    sendShipsAmount = 0
    viewport.resumePlugin('drag')
    viewport.resumePlugin('wheel')
}

function isSendingShips() {
    return drawLinesFrom
}

// Tells if the value x is between or equal to y and z within the error margin (error should be positive)
function isBetween(x, y, z, error) {
    if (y > z) {
        return z - error < x && x < y + error
    } else {
        return y - error < x && x < z + error
    }
}

function sendShips(fromPlanet, toX, toY, toPlanet, amount, duration) {
    removeShips(fromPlanet, amount)

    var ship = sendingShips.push(new Ship(fromPlanet.position.x, fromPlanet.position.y, toX, toY, shipSpeed, amount, fromPlanet.tint, toPlanet, duration))
}

const shipSpeed = 15 // units per second

function timeToFastestIntersect(from, to) {

    // Found on Desmos here https://www.desmos.com/calculator/ksdkwjxmdx

    let r = to.orbit.radius
    let x1 = from.position.x
    let y1 = from.position.y
    let s1Sqr = shipSpeed * shipSpeed

    // The first part of the equation
    let frst = (r * r) + (x1 * x1) + (y1 * y1)

    var time = 0
    var iterations = 0

    do {
        iterations++
        let pos = calcPlanetPosition(to, time)

        let d = Math.sqrt((frst - 2 * (x1 * pos.x + y1 * pos.y)) / s1Sqr)

        let delta = d - time

        // The smaller the right side of the < is, the more accurate, but also the more
        if (delta < 0.5) {
            return time
        } else if (delta < 2) {
            time += 0.1
        } else if (delta < 4) {
            time += 0.5
        } else {
            time += 1
        }


        let desired
    } while (iterations < 300)


    return {
        x: 0,
        y: 0
    }
}

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

// Variables for sending ships
const sunCollisionRadius = 30
const ticksPerCollideUpdate = 10
var updateLines = ticksPerCollideUpdate
const selectPlanetRadius = 100
var selectedPlanet
var sendShipsAmount = 0

// Stats
var lastPixels = 1
var pixels = 0
var lastShips = 1
var ships = 0

// Planet vars
var sendingShips
var planets
var myPlanet
var focusPlanet

function gameLoop() {

    updateKeyboard()

    let now = Date.now()
    let elasped = now - lastElapsed
    lastElapsed = now
    let eTime = (elasped * 0.001)

    // Update the particle emitter
    sun.update(eTime)

    for (i in planets) {
        // Age the planet
        planets[i].age += eTime;
        var pos = calcPlanetPosition(planets[i])
        planets[i].position.set(pos.x, pos.y)
        // Rotate the planet (purely for visual effects)
        planets[i].rotation = planets[i].age * planets[i].rotationConstant
        // Rotate the orbits (purely for visual effects)
        planets[i].orbit.rotation = -planets[i].age * planets[i].speed / 8
    }

    viewport.update()

    if (pixels != lastPixels) {
        lastPixels = pixels
        pixelText.text = 'Pixels: ' + pixels
    }
    if (ships != lastShips) {
        lastShips = ships
        shipsText.text = 'Ships: ' + ships
    }

    if (focusPlanet && focusPlanet == myPlanet) {
        buy1ShipText.visible = true
        buy10ShipText.visible = true
        buy100ShipText.visible = true
        sendShipText.visible = true
    } else {
        buy1ShipText.visible = false
        buy10ShipText.visible = false
        buy100ShipText.visible = false
        sendShipText.visible = false
    }

    // If drawing the ship travel lines
    if (isSendingShips()) {
        updateLines++

        if (updateLines > ticksPerCollideUpdate) {
            updateLines = 0
            selectedPlanet = null
        }

        // For each planet, draw a line from the drawLinesFrom planet to it
        for (i in planets) {
            // Don't draw a line from the drawLinesFrom planet to itself
            if (planets[i] != drawLinesFrom) {
                // Only draw lines every update cycle
                if (updateLines == 0) {
                    let planet = planets[i]
                    planet.outline.visible = false

                    // Player Planet
                    let pX = drawLinesFrom.position.x
                    let pY = drawLinesFrom.position.y

                    let targetTime = timeToFastestIntersect(drawLinesFrom, planet)
                    let target = calcPlanetPosition(planet, targetTime)

                    // Line Slope (origin is the Planet Player pos)
                    let mX = target.x - pX
                    let mY = target.y - pY

                    var collides = false

                    // Tests collision for the sun (same as above with planets)
                    if (isBetween(0, pX, target.x, sunCollisionRadius) && isBetween(0, pY, target.y, sunCollisionRadius)) {
                        // https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
                        let a = -mY
                        let b = mX
                        let c = (pX * mY) - (mX * pY)
                        var distSquared = (c * c) / (a * a + b * b)

                        // if the tradjectory intersects with a planet
                        if (distSquared < sunCollisionRadius * sunCollisionRadius) {
                            collides = true
                        }
                    }

                    // If it doesn't collide with the sun, test if it collides with a planet
                    if (!collides) {
                        for (n in planets) {
                            if (planets[n] != drawLinesFrom && planets[n] != planet) {
                                // current planet of interest
                                let current = planets[n]
                                let cPos = calcPlanetPosition(current, targetTime)
                                // If the target is within the bounds of the two planets
                                if (isBetween(cPos.x, pX, target.x, current.radius) && isBetween(cPos.y, pY, target.y, current.radius)) {
                                    // https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
                                    let a = -mY
                                    let b = mX
                                    let c = (pX * mY) - (mX * pY)
                                    let numerator = (a * cPos.x + b * cPos.y + c)
                                    var distSquared = (numerator * numerator) / (a * a + b * b)

                                    // if the tradjectory intersects with a planet
                                    if (distSquared < current.radius * current.radius) {
                                        collides = true
                                        break
                                    }
                                }
                            }
                        }
                    }

                    drawLines[i].visible = !collides
                    planet.ghost.visible = !collides

                    if (planet.ghost.visible = !collides) {
                        planet.ghost.position.set(target.x, target.y)
                    }

                    // Planet selection via mouse
                    if (!collides) {
                        let mouse = viewport.toWorld(game.renderer.plugins.interaction.mouse.global)
                        let targetDist = distSqr(mouse.x, mouse.y, target.x, target.y)
                        let planetDist = distSqr(mouse.x, mouse.y, planet.position.x, planet.position.y)

                        let radSqr = distSqr(0, 0, 0, selectPlanetRadius + planet.radius)

                        if (targetDist < radSqr || planetDist < radSqr) {
                            if (!selectedPlanet) {
                                selectedPlanet = planet
                            } else {
                                // if the mouse is within the selection radius of the planet

                                let selectedDist = distSqr(mouse.x, mouse.y, selectedPlanet.position.x, selectedPlanet.position.y)
                                let selectedGhostDist = distSqr(mouse.x, mouse.y, selectedPlanet.ghost.position.x, selectedPlanet.ghost.position.y)

                                if ((targetDist < selectedDist && targetDist < selectedGhostDist) || (planetDist < selectedDist && planetDist < selectedGhostDist)) {
                                    selectedPlanet = planet
                                }
                            }
                        }
                    }
                }

                drawLines[i].setPoints([planets[i].ghost.position.x,
                                       planets[i].ghost.position.y,
                                       drawLinesFrom.position.x,
                                       drawLinesFrom.position.y])
            }
        }

        if (updateLines == 0) {
            if (selectedPlanet) {
                selectedPlanet.outline.visible = true
            }
        }
    }

    for (i in sendingShips) {
        sendingShips[i].update(eTime)
    }

    updateHud()
}
