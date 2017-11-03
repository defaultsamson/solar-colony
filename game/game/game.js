/*********************** SETUP ***********************/

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
    .load(onLoad)

/*********************** INITIALIZATION ***********************/

var planets

function onLoad(loader, resources) {

    const orbit1 = game.stage.addChild(createOrbit(0, 0, 150, 25))
    const orbit2 = game.stage.addChild(createOrbit(0, 0, 220, 25))
    const orbit3 = game.stage.addChild(createOrbit(0, 0, 270, 25))
    const orbit4 = game.stage.addChild(createOrbit(0, 0, 350, 25))

    const sun = new PIXI.particles.Emitter(game.stage, resources.sunTexture.texture, sunParticle)
    sun.emit = true

    const planet1 = game.stage.addChild(createPlanet(resources.planet1.texture, orbit1, 0.1, 4867000000000000000000000, -1 / 4))
    const planet2 = game.stage.addChild(createPlanet(resources.planet2.texture, orbit2, 0.1, 5972000000000000000000000, -1 / 6))
    const planet3 = game.stage.addChild(createPlanet(resources.planet1.texture, orbit3, 0.1, 3639000000000000000000000, 1 / 3))
    const planet4 = game.stage.addChild(createPlanet(resources.planet2.texture, orbit4, 0.1, 7568300000000000000000000, -1.2))

    planets = [planet1, planet2, planet3, planet4]

    this.lastElapsed = Date.now()
    game.ticker.add(function () {

        updateKeyboard();

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
            planets[i].orbit.rotation = planets[i].age / planets[i].speed / 4
        }

        viewport.update()
    })

    viewport.moveCenter(0, 0)

    resize()
}

/*********************** INPUT ***********************/

const animTime = 600
var snappingToPlanet = false

function stopSnap() {
    viewport.removePlugin('snap')
    viewport.removePlugin('snap-zoom')
    this.snappingToPlanet = false
}

function stopFollow() {
    viewport.removePlugin('follow')
}

function centerView() {
    stopSnap()
    stopFollow()
    viewport.snap(0, 0, {
        time: animTime,
        removeOnComplete: true,
        ease: 'easeOutQuart'
    })
    viewport.snapZoom({
        height: h,
        time: animTime,
        removeOnComplete: true,
        center: true,
        ease: 'easeOutQuart'
    })
}

function updateKeyboard() {
    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.UP)) {
        stopSnap()
        stopFollow()
        viewport.snap(0, 0, {
            time: 1000,
            removeOnComplete: true,
            ease: 'easeOutQuart'
        })
    }

    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.RIGHT)) {

        viewport.snapZoom({
            height: 200,
            time: 5000,
            removeOnComplete: true,
            ease: 'easeOutExpo',
            center: {
                x: 0,
                y: 0
            }
        })
    }

    // This is a test
    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        viewport.removePlugin('snap')
    }

    if (PIXI.keyboardManager.isPressed(Key.ESCAPE)) {
        stopSnap()
        stopFollow()
        centerView()
    }

    PIXI.keyboardManager.update()
}

viewport.on('drag-start', function (e) {
    stopSnap()
    stopFollow()
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', function (e) {
    stopSnap()

    var planet = getPlanet(e.world.x, e.world.y)
    if (planet) {

        // If the viewport is already following the planet that was clicked on, then don't do anything
        var follow = viewport.plugins['follow']
        if (follow && (follow.target == planet)) {
            return
        }

        this.snappingToPlanet = planet

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
                height: 150,
                time: animTime,
                removeOnComplete: true,
                ease: 'easeInOutSine'
            })
        }

    } else {
        // If no planet was clicked on, remove the follow plugin
        stopFollow()

        const sunRadiusSqr = 100 * 100

        if (distSqr(e.world.x, e.world.y, 0, 0) < sunRadiusSqr) {
            centerView()
        }
    }
})
// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
viewport.on('snap-end', function () {
    if (this.snappingToPlanet) {
        viewport.follow(this.snappingToPlanet)
        this.snappingToPlanet = false
    }
})

/*********************** CREATE ***********************/

const minDashes = 2
const dashThickness = 1.4

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

const G = 6.67 * 0.00000000001 // Gravitational constant
const ppm = 0.0004 // pixels per meter
const starMass = 2188000000000000000000000000000 // kg

function createPlanet(texture, orbit, scale, mass, rotationConstant) {
    var planet = new PIXI.Sprite(texture)
    planet.radius = 0.5 * planet.width
    planet.orbit = orbit
    planet.pivot.set(planet.radius, planet.radius)
    planet.scale.set(scale)
    planet.radius = planet.radius * planet.scale.x
    planet.age = 0
    planet.position.set(orbit.radius, 0)
    planet.mass = mass
    planet.speed = Math.sqrt((G * planet.mass) / (planet.radius / ppm)) * ppm
    planet.rotationConstant = rotationConstant
    return planet
}

/*********************** UTIL ***********************/

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
    return ((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2))
}

function calcPlanetPosition(planet, additionalAge) {
    if (!additionalAge)
        additionalAge = 0

    let radius = planet.orbit.radius
    let age = planet.age + additionalAge
    let x = Math.cos((age * planet.speed) / radius) * radius
    let y = Math.sin((age * planet.speed) / radius) * radius
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
}

/*********************** GAME ***********************/

var planets