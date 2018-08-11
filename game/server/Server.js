require('../shared/Constants.js')
require('../shared/Util.js')

let GameManager = require('./GameManager.js')

let server = new GameManager()

console.log('Server Started: ' + (LOCAL_DEBUG ? "Local" : "Online"))
