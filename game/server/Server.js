require('../shared/Util.js')
require('../shared/Constants.js')

let GameManager = require('./GameManager.js')

let server = new GameManager()

console.log('Server Started: ' + (LOCAL_DEBUG ? "Local" : "Online"))
