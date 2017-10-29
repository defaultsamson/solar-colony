require('pixi.js')
const Viewport = require('pixi-viewport')
// Prevents error from pixi-keyboard and pivi-particles
window.PIXI = PIXI
window.PIXI['default'] = PIXI
// const Keyboard = require('pixi-keyboard')
require('pixi-particles')
require('pixi-keyboard')

function updateKeyboard() {
    /*
    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        console.log('Down key is pressed')
    }*/

    shift = PIXI.keyboardManager.isDown(Key.SHIFT)

    if (PIXI.keyboardManager.isPressed(Key.UP)) {

        //_viewport.on('snap-end', () => addCounter('snap-end'))
        viewport.plugins['decelerate'].reset()
        viewport.snap(0, 0, {
            time: 1000,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutQuart'
        })
        viewport.removePlugin('follow')
    }

    if (PIXI.keyboardManager.isPressed(Key.RIGHT)) {

        //_viewport.on('snap-end', () => addCounter('snap-end'))
        viewport.snapZoom(0, 200, {
            time: 5000,
            removeOnComplete: true,
            ease: 'easeOutExpo',
            center: {
                x: 0,
                y: 0
            }
        })
    }

    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        viewport.removePlugin('snap')
    }

    PIXI.keyboardManager.update()
}

//document.addEventListener('mousewheel', mouseWheelHandler, false)

const maxHeight = 1000
const minHeight = 100

window.addEventListener('resize', resize)
window.onorientationchange = resize

// h is the constant height of the viewport.
const h = 600
// w is less important because the width can change. Mostly just used for initializing other objects
const w = 600

// Creates the PIXI application
var game = new PIXI.Application(w, h, {
    antialias: true,
    transparent: false
})

// Sets up the element
game.view.style.position = 'absolute'
game.view.style.display = 'block'
document.body.appendChild(game.view)
game.renderer.autoResize = true
game.renderer.backgroundColor = Colour.background

// Adds the keyboard update loop to the ticker
game.ticker.add(updateKeyboard)

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
var options = {
    pauseOnBlur: true,
    screenWidth: w,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
}

var viewport = new Viewport(game.stage, options)

var clampOptions = {
    minWidth: 1,
    minHeight: minHeight,
    maxWidth: 1000 * w,
    maxHeight: maxHeight
}

viewport
    .drag()
    .wheel()
    .pinch({
        percent: 4.5
    })
    .clampZoom(clampOptions)
    .decelerate()

function stopSnap() {
    viewport.removePlugin('snap')
    viewport.removePlugin('snap-zoom')
}

viewport.on('drag-start', function (e) {
    stopSnap()

    viewport.removePlugin('follow')
})
viewport.on('pinch-start', stopSnap)
viewport.on('wheel', stopSnap)
viewport.on('click', function (e) {
    stopSnap()

    var planet = getPlanet(e.world.x, e.world.y)
    if (planet) {
        const animTime = 200

        this.doTheZoom = shift

        // The calculated future positions of the planet
        var x = Math.cos(((planet.age + (animTime / 1000)) * planet.speed) / planet.orbit.radius) * planet.orbit.radius
        var y = Math.sin(((planet.age + (animTime / 1000)) * planet.speed) / planet.orbit.radius) * planet.orbit.radius

        viewport.snap(x, y, {
            time: animTime,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutCirc'
        })

        viewport.on('snap-end', function () {
            viewport.follow(planet)

            if (this.doTheZoom) {
                this.doTheZoom = false
                viewport.snapZoom({
                    time: (animTime * 2),
                    removeOnComplete: true,
                    ease: 'easeOutCirc',
                    direction: 'y'
                }, 150)
            }
        })
    } else {
        viewport.removePlugin('follow')
    }
})

var planets

// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40

function getPlanet(x, y) {
    for (var i in planets) {
        var distSqr = ((x - planets[i].x) * (x - planets[i].x)) + ((y - planets[i].y) * (y - planets[i].y))
        if (distSqr < ((planets[i].radius + clickThreshold) * (planets[i].radius + clickThreshold))) {
            return planets[i]
        }
    }

    return null
}

PIXI.loader
    .add('sunTexture', 'game/sun.png')
    .add('planet1', 'game/planet1.png')
    .add('planet2', 'game/planet2.png')
    .load(onLoad)

const G = 6.67 * 0.00000000001 // Gravitational constant
const ppm = 0.0004 // pixels per meter
const starMass = 2188000000000000000000000000000 // kg

function createPlanet(texture, orbit, scale, mass) {
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
    return planet
}

function onLoad(loader, resources) {

    var orbit1 = game.stage.addChild(dottedCircle(0, 0, 150, 25))
    var orbit2 = game.stage.addChild(dottedCircle(0, 0, 220, 25))
    var orbit3 = game.stage.addChild(dottedCircle(0, 0, 270, 25))
    var orbit4 = game.stage.addChild(dottedCircle(0, 0, 350, 25))

    resize()

    var sun = new PIXI.particles.Emitter(game.stage, resources.sunTexture.texture, sunParticle)
    sun.emit = true

    var planet1 = game.stage.addChild(createPlanet(resources.planet1.texture, orbit1, 0.1, 4867000000000000000000000))
    var planet2 = game.stage.addChild(createPlanet(resources.planet2.texture, orbit2, 0.1, 5972000000000000000000000))
    var planet3 = game.stage.addChild(createPlanet(resources.planet1.texture, orbit3, 0.1, 3639000000000000000000000))
    var planet4 = game.stage.addChild(createPlanet(resources.planet2.texture, orbit4, 0.1, 7568300000000000000000000))

    planets = [planet1, planet2, planet3, planet4]

    this.lastElapsed = Date.now()
    game.ticker.add(function () {

        viewport.update()

        var now = Date.now()
        var elasped = now - lastElapsed
        lastElapsed = now
        let eTime = (elasped * 0.001)

        sun.update(eTime)

        // Rotate the orbits (purely for visual effects)
        orbit1.rotation += eTime / 50
        orbit2.rotation += eTime / 80
        orbit3.rotation += eTime / 140
        orbit4.rotation += eTime / 200

        for (i in planets) {
            planets[i].age += eTime;
            let radius = planets[i].orbit.radius
            let x = Math.cos((planets[i].age * planets[i].speed) / radius) * radius
            let y = Math.sin((planets[i].age * planets[i].speed) / radius) * radius
            planets[i].position.set(x, y)
        }

        // TODO add these to the createPlanet stuff
        planet1.rotation = -planet1.age / 4
        planet2.rotation = -planet2.age / 6
        planet3.rotation = planet3.age / 3
        planet4.rotation = -planet4.age / 2
    })

    viewport.moveCenter(0, 0)
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

const minDashes = 2
const dashThickness = 1.4

function dottedCircle(x, y, radius, dashLength) {

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
