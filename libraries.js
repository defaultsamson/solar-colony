require('pixi.js')
Viewport = require('pixi-viewport')
// Prevents error from pixi-keyboard and pivi-particles
window.PIXI = PIXI
window.PIXI['default'] = PIXI
// const Keyboard = require('pixi-keyboard')
require('pixi-particles')
require('pixi-keyboard')
