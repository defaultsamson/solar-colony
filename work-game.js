require('pixi.js');
const Viewport = require('pixi-viewport');
// Prevents error from pixi-keyboard
window.PIXI = PIXI;
window.PIXI["default"] = PIXI;
const Keyboard = require('pixi-keyboard');

function updateKeyboard() {
    /*
    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        console.log('Down key is pressed');
    }*/

    PIXI.keyboardManager.update();
}

//document.addEventListener("mousewheel", mouseWheelHandler, false);

const maxHeight = 1000;
const minHeight = 100;

window.addEventListener('resize', resize);
window.onorientationchange = resize;

// h is the constant height of the viewport.
var h = 600;
// w is less important because the width can change. Mostly just used for initializing other objects
var w = 600;

// Creates the PIXI application
var game = new PIXI.Application(w, h, {
    antialias: false,
    transparent: false,
    resolution: 1
});

// Sets up the element
game.view.style.position = "absolute";
game.view.style.display = "block";
document.body.appendChild(game.view);
game.renderer.autoResize = true;
game.renderer.backgroundColor = 0x000000;

// Adds the keyboard update loop to the ticker
game.ticker.add(updateKeyboard);

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
var options = {
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
    .hitArea()
    .wheel()
    .pinch()
    .clampZoom(clampOptions)
    .decelerate()
    .start();

PIXI.loader.add('bunny', 'game/bunny.png').load(function (loader, resources) {

    // This creates a texture from a 'bunny.png' image.
    var bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    bunny.x = game.renderer.width / 2;
    bunny.y = game.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building.
    //    game.stage.addChild(bunny);

    // Listen for frame updates
    game.ticker.add(function () {
        // each frame we spin the bunny around a bit
        //bunny.rotation += 0.01;
        //bunny.x += 0.2
    });

    game.stage.addChild(dottedCircle(30, 30, 10, 10));
    game.stage.addChild(dottedCircle(60, 30, 10, 14));
    game.stage.addChild(dottedCircle(90, 30, 10, 18));
    game.stage.addChild(dottedCircle(120, 30, 10, 24));
    game.stage.addChild(dottedCircle(150, 30, 10, 28));
    game.stage.addChild(dottedCircle(180, 30, 10, 32));
    game.stage.addChild(dottedCircle(210, 30, 10, 36));
    game.stage.addChild(dottedCircle(240, 30, 10, 40));

    game.stage.addChild(dottedCircle(200, 200, 100, 10));
    game.stage.addChild(dottedCircle(200, 200, 90, 10));
    game.stage.addChild(dottedCircle(200, 200, 80, 10));
    game.stage.addChild(dottedCircle(200, 200, 70, 10));
    game.stage.addChild(dottedCircle(200, 200, 60, 10));

    resize();
    //viewport.follow(bunny);
});


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
}

const minDashes = 2;

function dottedCircle(x, y, radius, dashLength) {

    var numOfDashes = Math.max(Math.floor(Math.PI * radius / dashLength), minDashes);
    var dashRadians = dashLength / radius;
    var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians;

    var pixiCircle = new PIXI.Graphics();

    // If it's a full circle, draw it full (more optimised)
    if (spacingRadians <= 0) {
        pixiCircle.lineStyle(2, 0xFF00FF); //(thickness, color)
        pixiCircle.arc(x, y, radius, 0, 2 * Math.PI);
    } else { // Else, draw it dashed
        for (i = 0; i < numOfDashes; i++) {
            var start = i * (dashRadians + spacingRadians);
            var end1 = start + dashRadians;
            var end2 = end1 + spacingRadians;
            pixiCircle.lineStyle(2, 0xFF00FF); //(thickness, color)
            pixiCircle.arc(x, y, radius, start, end1);
            pixiCircle.lineStyle(2, 0xFFFF00, 0);
            pixiCircle.arc(x, y, radius, end1, end2);
        }
    }

    return pixiCircle;
}

// Make black once done loading
game.renderer.backgroundColor = 0x00FFFF;
