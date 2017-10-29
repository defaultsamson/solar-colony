require('pixi.js');
const Viewport = require('pixi-viewport');
// Prevents error from pixi-keyboard and pivi-particles
window.PIXI = PIXI;
window.PIXI["default"] = PIXI;
// const Keyboard = require('pixi-keyboard');
require('pixi-particles');
require('pixi-keyboard');

function updateKeyboard() {
    /*
    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        console.log('Down key is pressed');
    }*/

    shift = PIXI.keyboardManager.isDown(Key.SHIFT);

    if (PIXI.keyboardManager.isPressed(Key.UP)) {

        //_viewport.on('snap-end', () => addCounter('snap-end'))
        viewport.plugins['decelerate'].reset();
        viewport.snap(0, 0, {
            time: 1000,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutQuart'
        });
        viewport.removePlugin('follow');
    }

    if (PIXI.keyboardManager.isPressed(Key.RIGHT)) {

        //_viewport.on('snap-end', () => addCounter('snap-end'))
        viewport.fit({
            time: 500,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutExpo',
            direction: 'y'
        }, 150);
    }

    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        viewport.removePlugin('snap');
    }

    PIXI.keyboardManager.update();
}

//document.addEventListener("mousewheel", mouseWheelHandler, false);

const maxHeight = 1000;
const minHeight = 100;

window.addEventListener('resize', resize);
window.onorientationchange = resize;

// h is the constant height of the viewport.
const h = 600;
// w is less important because the width can change. Mostly just used for initializing other objects
const w = 600;

// Creates the PIXI application
var game = new PIXI.Application(w, h, {
    antialias: true,
    transparent: false
});

// Sets up the element
game.view.style.position = "absolute";
game.view.style.display = "block";
document.body.appendChild(game.view);
game.renderer.autoResize = true;
game.renderer.backgroundColor = Colour.background;

// Adds the keyboard update loop to the ticker
game.ticker.add(updateKeyboard);

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
var options = {
    pauseOnBlur: true,
    screenWidth: w,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
};

var viewport = new Viewport(game.stage, options);

var clampOptions = {
    minWidth: 1,
    minHeight: minHeight,
    maxWidth: 1000 * w,
    maxHeight: maxHeight
};

viewport
    .drag()
    .wheel()
    .pinch({
        percent: 4.5
    })
    .clampZoom(clampOptions)
    .decelerate()
    .start();

function stopSnap() {
    viewport.removePlugin('snap');
    viewport.removePlugin('fit');
}

viewport.on('drag-start', function (e) {
    stopSnap();

    viewport.removePlugin('follow');
});
viewport.on('pinch-start', stopSnap);
viewport.on('wheel', stopSnap);
viewport.on('click', function (e) {
    stopSnap();

    var planet = getPlanet(e.world.x, e.world.y);
    if (planet) {
        const animTime = 200;

        this.doTheZoom = shift;

        // The calculated future positions of the planet
        var x = Math.cos(((planet.age + (animTime / 1000)) * planet.speed) / planet.orbit.radius) * planet.orbit.radius;
        var y = Math.sin(((planet.age + (animTime / 1000)) * planet.speed) / planet.orbit.radius) * planet.orbit.radius;

        viewport.snap(x, y, {
            time: animTime,
            removeOnComplete: true,
            center: true,
            ease: 'easeOutCirc'
        });

        viewport.on('snap-end', function () {
            viewport.follow(planet);

            if (this.doTheZoom) {
                this.doTheZoom = false;
                viewport.fit({
                    time: (animTime * 2),
                    removeOnComplete: true,
                    center: true,
                    ease: 'easeOutCirc',
                    direction: 'y'
                }, 150);
            }
        })
    } else {
        viewport.removePlugin('follow');
    }
});

var planets;

// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40;

function getPlanet(x, y) {
    for (var i in planets) {
        var distSqr = ((x - planets[i].x) * (x - planets[i].x)) + ((y - planets[i].y) * (y - planets[i].y));
        if (distSqr < ((planets[i].radius + clickThreshold) * (planets[i].radius + clickThreshold))) {
            return planets[i];
        }
    }

    return null;
}

PIXI.loader
    .add('sunTexture', 'game/sun.png')
    .add('planet1', 'game/planet1.png')
    .add('planet2', 'game/planet2.png')
    .load(onLoad);

function onLoad(loader, resources) {

    var orbit1 = game.stage.addChild(dottedCircle(0, 0, 150, 25));
    var orbit2 = game.stage.addChild(dottedCircle(0, 0, 220, 25));
    var orbit3 = game.stage.addChild(dottedCircle(0, 0, 270, 25));
    var orbit4 = game.stage.addChild(dottedCircle(0, 0, 350, 25));

    resize();

    var sun = new PIXI.particles.Emitter(game.stage, resources.sunTexture.texture, sunParticle);
    sun.emit = true;

    var planet1 = new PIXI.Sprite(resources.planet1.texture);
    planet1.radius = 0.5 * planet1.width;
    planet1.orbit = orbit1;
    planet1.pivot.set(planet1.radius, planet1.radius);
    planet1.scale.set(0.1);
    planet1.radius = planet1.radius * planet1.scale.x;
    planet1.age = 0;
    planet1.position.x = orbit1.radius;
    game.stage.addChild(planet1);

    var planet2 = new PIXI.Sprite(resources.planet2.texture);
    planet2.radius = 0.5 * planet2.width;
    planet2.orbit = orbit2;
    planet2.pivot.set(planet2.radius, planet2.radius);
    planet2.scale.set(0.1);
    planet2.radius = planet2.radius * planet2.scale.x;
    planet2.age = 0;
    planet2.position.x = orbit2.radius;
    game.stage.addChild(planet2);

    var planet3 = new PIXI.Sprite(resources.planet1.texture);
    planet3.radius = 0.5 * planet3.width;
    planet3.orbit = orbit3;
    planet3.pivot.set(planet3.radius, planet3.radius);
    planet3.scale.set(0.1);
    planet3.radius = planet3.radius * planet3.scale.x;
    planet3.age = 0;
    planet3.position.x = orbit3.radius;
    game.stage.addChild(planet3);

    var planet4 = new PIXI.Sprite(resources.planet2.texture);
    planet4.radius = 0.5 * planet4.width;
    planet4.orbit = orbit4;
    planet4.pivot.set(planet4.radius, planet4.radius);
    planet4.scale.set(0.1);
    planet4.radius = planet4.radius * planet4.scale.x;
    planet4.age = 0;
    planet4.position.x = orbit4.radius;
    game.stage.addChild(planet4);


    planets = [planet1, planet2, planet3, planet4];

    const G = 6.67 * 0.00000000001;
    const ppm = 0.0004;
    const starMass = 2188000000000000000000000000000; // kg
    planet1.mass = 4867000000000000000000000;
    planet1.speed = Math.sqrt((G * planet1.mass) / (planet1.radius / ppm)) * ppm;

    planet2.mass = 5972000000000000000000000;
    planet2.speed = Math.sqrt((G * planet2.mass) / (planet2.radius / ppm)) * ppm;

    planet3.mass = 3639000000000000000000000;
    planet3.speed = Math.sqrt((G * planet3.mass) / (planet3.radius / ppm)) * ppm;

    planet4.mass = 7568300000000000000000000;
    planet4.speed = Math.sqrt((G * planet4.mass) / (planet4.radius / ppm)) * ppm;
    // var v = sqrt(G * m_planet / radius)

    this.lastElapsed = Date.now();
    game.ticker.add(function () {
        var now = Date.now();
        var elasped = now - lastElapsed;
        lastElapsed = now;
        sun.update(elasped * 0.001);

        // Rotate the orbits (purely for visual effects)
        orbit1.rotation += (elasped * 0.001) / 50;
        orbit2.rotation += (elasped * 0.001) / 80;
        orbit3.rotation += (elasped * 0.001) / 140;
        orbit4.rotation += (elasped * 0.001) / 200;

        planet1.age += (elasped * 0.001);
        planet1.rotation = -planet1.age / 4;
        planet1.position.x = Math.cos((planet1.age * planet1.speed) / orbit1.radius) * orbit1.radius;
        planet1.position.y = Math.sin((planet1.age * planet1.speed) / orbit1.radius) * orbit1.radius;

        planet2.age += (elasped * 0.001);
        planet2.rotation = -planet2.age / 6;
        planet2.position.x = Math.cos((planet2.age * planet2.speed) / orbit2.radius) * orbit2.radius;
        planet2.position.y = Math.sin((planet2.age * planet2.speed) / orbit2.radius) * orbit2.radius;

        planet3.age += (elasped * 0.001);
        planet3.rotation = planet3.age / 3;
        planet3.position.x = Math.cos((planet3.age * planet3.speed) / orbit3.radius) * orbit3.radius;
        planet3.position.y = Math.sin((planet3.age * planet3.speed) / orbit3.radius) * orbit3.radius;

        planet4.age += (elasped * 0.001);
        planet4.rotation = -planet4.age / 2;
        planet4.position.x = Math.cos((planet4.age * planet4.speed) / orbit4.radius) * orbit4.radius;
        planet4.position.y = Math.sin((planet4.age * planet4.speed) / orbit4.radius) * orbit4.radius;
    });

    viewport.moveCenter(0, 0);
}

function resize() {
    window.scrollTo(0, 0);

    var oldCenter;
    if (viewport.center) {
        oldCenter = viewport.center;
    }

    var prevHeight = viewport.worldScreenHeight;

    var width = window.innerWidth;
    var height = window.innerHeight;
    var ratio = height / h;

    game.renderer.resize(width, height);
    viewport.resize(width, height);
    viewport.fitHeight(prevHeight, false);

    // Must maintain the center manually instad of using fitHeight's built in one because the
    // center value will change upon resizing the viewport and game window
    if (oldCenter) {
        viewport.moveCenter(oldCenter);
    }

    stopSnap();
}

const minDashes = 2;
const dashThickness = 1.4;

function dottedCircle(x, y, radius, dashLength) {

    var numOfDashes = Math.max(Math.floor(Math.PI * radius / dashLength), minDashes);
    var dashRadians = dashLength / radius;
    var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians;

    var pixiCircle = new PIXI.Graphics();
    pixiCircle.radius = radius;

    // If it's a full circle, draw it full (more optimised)
    if (spacingRadians <= 0) {
        pixiCircle.lineStyle(dashThickness, Colour.dashedLine); //(thickness, color)
        pixiCircle.arc(x, y, radius, 0, 2 * Math.PI);
    } else { // Else, draw it dashed
        for (i = 0; i < numOfDashes; i++) {
            var start = i * (dashRadians + spacingRadians);
            var end1 = start + dashRadians;
            var end2 = end1 + spacingRadians;
            pixiCircle.lineStyle(dashThickness, Colour.dashedLine); //(thickness, color)
            pixiCircle.arc(x, y, radius, start, end1);
            pixiCircle.lineStyle(dashThickness, Colour.background, 0);
            pixiCircle.arc(x, y, radius, end1, end2);
        }
    }

    // disgusting
    // pixiCircle.cacheAsBitmap = true;

    return pixiCircle;
}
