var SocketManager = require('./SocketManager.js')
let gameloop = require('node-gameloop')

class ServerObj extends Object {
    constructor() {
        super()

        this.games = []

        this.gameLoopID = gameloop.setGameLoop(function (delta) {
            for (i in ServerObj.games) {
                ServerObj.games[i].update(delta)
            }
        }, 1000 / 30);

        this.socket = new SocketManager(this)
        this.socket.connect()
    }



    parse(sender, type, packet) {

        switch (type) {
            case 'form':
                this.socket.addConnection(sender, packet.host, packet.user, packet.id)
                break
        }

        if (this.socket.approved(sender)) {

        }

        console.log('type: ' + type)
        console.log('packet: ' + packet)
    }

    createGame(p1, p2) {
        const orbit1 = new Orbit(0, 0, 150)
        const orbit2 = new Orbit(0, 0, 220)
        const orbit3 = new Orbit(0, 0, 270)
        const orbit4 = new Orbit(0, 0, 360)

        const planet1 = new Planet(190, orbit1, 0.1, -1 / 4, Math.PI / 2, 2)
        const planet2a = new Planet(190, orbit2, 0.1, -1 / 6, 0, 1)
        const planet2b = new Planet(190, orbit2, 0.1, -1 / 6, Math.PI, 1)
        const planet3 = new Planet(190, orbit3, 0.1, 1 / 3, Math.PI / 4, 1 / 2)
        const planet4 = new Planet(190, orbit4, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4)

        var planets = [planet1, planet2a, planet2b, planet3, planet4]

        // Setup for testing the game
        var myPlanets = [planet2a]
        var yourPlanets = [planet2b]

        planet2a.createSpawn(true)
        planet2b.createSpawn(true)

        var system = new System()
    }

    findGame(gameID) {
        for (i in this.games) {
            if (this.games[i].gameID == gameID)
                return this.games[i]
        }
        return null
    }
}

module.exports = ServerObj
