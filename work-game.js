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
game.renderer.backgroundColor = 0x00FFFF;

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
    game.stage.addChild(bunny);

    // Listen for frame updates
    game.ticker.add(function () {
        // each frame we spin the bunny around a bit
        //bunny.rotation += 0.01;
        //bunny.x += 0.2
    });

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
