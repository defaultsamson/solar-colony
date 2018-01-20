var SocketManager = require('./SocketManager.js')
let gameloop = require('node-gameloop')
var Game = require('./Game.js')

const idLength = 6
const idChars = 'ABCDEFGHJKMNOPQRSTUVWXYZ23456789'

class GameManager extends Object {
    constructor() {
        super()

        this.waiting = null

        this.games = []

        let so = this

        this.gameLoopID = gameloop.setGameLoop(function (delta) {
            for (var i in so.games) {
                so.games[i].update(delta)
            }
        }, 1000 / 30);

        this.socket = new SocketManager(this)
        this.socket.connect()
    }

    parse(sender, type, packet) {

        if (this.socket.approved(sender)) {
            sender.game.parse(sender, type, packet)
        } else if (type == 'form') {
            this.socket.addConnection(sender, packet.host, packet.user, packet.id)
        }

        // console.log('type: ' + type)
        // console.log('packet: ' + packet)
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
        console.log('Creating Game: ' + id)

        return game
    }

    removeGame(game) {
        var i = this.games.indexOf(game)
        if (i != -1) {
            this.games.splice(i, 1)
            console.log('Removing Game: ' + game.gameID)
        }
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

module.exports = GameManager
