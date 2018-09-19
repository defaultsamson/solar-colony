global.IS_SERVER = true

require('../shared/Constants.js')
require('../shared/Util.js')

global.Planet = require('../shared/Planet.js')
global.Orbit = require('../shared/Orbit.js')

const GameManager = require('./GameManager.js')

let server = new GameManager()

console.log('Server Started: ' + (LOCAL_DEBUG ? 'Local' : 'Online'))
