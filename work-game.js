require('pixi.js');
const Viewport = require('pixi-viewport');
// Prevents error from pixi-keyboard
window.PIXI = PIXI;
window.PIXI["default"] = PIXI;
const Keyboard = require('pixi-keyboard');

console.log('keys1: ' + Key)

function updateKeyboard() {

    if (PIXI.keyboardManager.isPressed(38)) {
        console.log('Up key is pressed');
    }

    if (PIXI.keyboardManager.isPressed(Key.DOWN)) {
        console.log('Down key is pressed');
    }

    PIXI.keyboardManager.update();
}

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

// Adds the keyboard update loop to the ticker
game.ticker.add(updateKeyboard);

// Viewport options. Not very important because it can vary (see resize() )
// These are mostly just used for initialization so that no errors occur
var options = {
    screenWidth: w * 2,
    screenHeight: h,
    worldWidth: w,
    worldHeight: h,
};

var viewport = new Viewport(game.stage, options);

viewport
    .drag()
    .hitArea()
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
        bunny.rotation += 0.01;
        bunny.x += 5
    });

    resize();

    viewport.follow(bunny);
});

function resize() {
    window.scrollTo(0, 0);

    var width = window.innerWidth;
    var height = window.innerHeight;
    var ratio = height / h;

    game.renderer.resize(width, height);
    /*game.view.style.width = width + "px";
    game.view.style.height = height + "px";
    game.renderer.view.width = width;
    game.renderer.view.height = height;*/

    game.stage.setTransform(0, 0, ratio, ratio, 0, 0, 0, 0, 0);

    viewport.screenWidth = width;
    viewport.screenHeight = height;

    /*console.log('v-width: ' + viewport.screenWidth +
        '\nv-height: ' + viewport.screenHeight +
        '\nw-width: ' + viewport.worldWidth +
        '\nw-height: ' + viewport.worldHeight);*/

    viewport.update();
}


game.renderer.backgroundColor = 0x00FFFF;


/*
// load the texture we need
PIXI.loader.add('bunny', 'bunny.png').load(function(loader, resources) {

    // This creates a texture from a 'bunny.png' image.
    var bunny = new PIXI.Sprite(resources.bunny.texture);

    // Setup the position of the bunny
    bunny.x = app.renderer.width / 2;
    bunny.y = app.renderer.height / 2;

    // Rotate around the center
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;

    // Add the bunny to the scene we are building.
    app.stage.addChild(bunny);

    // Listen for frame updates
    app.ticker.add(function() {
        // each frame we spin the bunny around a bit
        bunny.rotation += 0.0003;
    });
});*/
