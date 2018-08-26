require('pixi.js')
Viewport = require('pixi-viewport')
// Prevents error from pixi-keyboard and pixi-particles
window.PIXI = PIXI
window.PIXI['default'] = PIXI
require('pixi-particles')
