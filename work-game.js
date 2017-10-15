window.addEventListener('resize', function () {
    resize();
});

window.onorientationchange = resize;

alert(1);

var h = 600;
var w = 600;

var game = new PIXI.Application(w, h, {
    antialias: false,
    transparent: false,
    resolution: 1
});

game.view.style.position = "absolute";
game.view.style.display = "block";
document.body.appendChild(game.view);
game.renderer.autoResize = true;
resize();

const Viewport = require('pixi-viewport')

const container = new PIXI.Container()
const viewport = new Viewport(container)

PIXI.loader.add('bunny', 'bunny.png').load(function (loader, resources) {

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

});

/*
//Use Pixi's built-in `loader` object to load an image
PIXI.loader
    .add("bunny.png")
    .load(setup);

//This `setup` function will run when the image has loaded
function setup() {

    //Create the `cat` sprite from the texture
    var cat = new PIXI.Sprite(
        PIXI.loader.resources["bunny.png"].texture
    );



    //Add the cat to the stage
    game.stage.addChild(cat);


    resize();
    //Render the stage   
    //renderer.render(stage);
}*/

function resize() {
    window.scrollTo(0, 0);

    var width = window.innerWidth;
    var height = window.innerHeight;
    var ratio = height / h;

    game.renderer.resize(width, height);
    game.view.style.width = width + "px";
    game.view.style.height = height + "px";
    game.renderer.view.width = width;
    game.renderer.view.height = height;

    game.stage.setTransform(0, 0, ratio, ratio, 0, 0, 0, 0, 0);
}


game.renderer.backgroundColor = 0x00FFFF;


//

//var app = new PIXI.Application();

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container.
/*var app = new PIXI.Application();

// The application will create a canvas element for you that you
// can then insert into the DOM.
document.body.appendChild(app.view);

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


/*
var rendererOptions = {
    antialiasing: false,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoResize: true,
}

// Create the canvas in which the game will show, and a
// generic container for all the graphical objects
renderer = PIXI.autoDetectRenderer(800, 600,
    rendererOptions);

// Put the renderer on screen in the corner
renderer.view.style.position = "absolute";
renderer.view.style.top = "0px";
renderer.view.style.left = "0px";

// The stage is essentially a display list of all game objects
// for Pixi to render; it's used in resize(), so it must exist
stage = new PIXI.Container();

// Size the renderer to fill the screen
resize();

// Actually place the renderer onto the page for display
document.body.appendChild(renderer.view);

// Listen for and adapt to changes to the screen size, e.g.,
// user changing the window or rotating their device
window.addEventListener("resize", resize);


function resize() {

    // Determine which screen dimension is most constrained
    ratio = Math.min(window.innerWidth / 800,
        window.innerHeight / 600);

    // Scale the view appropriately to fill that dimension
    stage.scale.x = stage.scale.y = ratio;

    // Update the renderer dimensions
    renderer.resize(Math.ceil(800 * ratio),
        Math.ceil(600 * ratio));
}*/
