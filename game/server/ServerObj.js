var SocketManager = require('./SocketManager.js')
let gameloop = require('node-gameloop')
var Game = require('./Game.js')

const idLength = 6
const idChars = 'ABCDEFGHJKMNOPQRSTUVWXYZ23456789'

class ServerObj extends Object {
    constructor() {
        super()

        this.waiting = null

        this.games = []

        this.gameLoopID = gameloop.setGameLoop(function (delta) {
            for (var i in ServerObj.games) {
                ServerObj.games[i].update(delta)
            }
        }, 1000 / 30);

        this.socket = new SocketManager(this)
        this.socket.connect()
    }

    parse(sender, type, packet) {

        if (this.socket.approved(sender)) {
            switch (type) {
                case 'form':
                    break
            }
        } else if (type == 'form') {
            this.socket.addConnection(sender, packet.host, packet.user, packet.id)
        }

        console.log('type: ' + type)
        console.log('packet: ' + packet)
    }

    // TODO move into Game class
    createSystem(p1, p2) {
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
        for (var i in this.games) {
            if (this.games[i].gameID == gameID)
                return this.games[i]
        }
        return null
    }

    createGame() {
        // Create a game with an ID
        var id = this.generateSafeID()

        var game = new Game(id)
        this.games.push(game)

        return game
    }

    queue(sock) {
        if (this.waiting) {
            var game = this.createGame()
            game.addPlayer(this.waiting)
            game.addPlayer(sock)
            this.waiting = null
        } else {
            this.waiting = sock;
        }
    }

    // Generates an ID that no other game currently has
    generateSafeID() {
        var id
        while (true) {
            id = this.generateID()
            if (this.findGame(id) == null) {
                return id
            }
        }
    }

    // Generates a random game ID
    generateID() {
        var id = ''
        for (var i = 0; i < idLength; i++) {
            id += idChars.charAt(Math.floor(Math.random() * idChars.length))
        }
        return id
    }
}

module.exports = ServerObj
