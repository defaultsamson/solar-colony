var SocketManager = require('./SocketManager.js')
let gameloop = require('node-gameloop')
var ServerGame = require('./ServerGame.js')

class GameManager extends Object {
	constructor() {
		super()

		this.queuedGames = []
		this.games = []

		let so = this

		this.gameLoopID = gameloop.setGameLoop(function(delta) {
			for (var i in so.games) {
				try {
					so.games[i].update(delta)
				} catch (err) {
					console.log("================================")
					console.log("ERROR: Server game tick error...")
					console.log("================================")
					console.log(err)
				}
			}
		}, 1000 / TICKS_PER_SECOND);

		this.socket = new SocketManager(this)
		this.socket.connect()
	}

	parse(sender, type, packet) {

		if (type == Pack.PING_PROBE) {
			if (sender.pinger) {
				sender.pinger.recieve()
			}
		} else if (this.socket.approved(sender)) {
			sender.game.parse(sender, type, packet)
		} else if (type == Pack.FORM_SEND) {
			this.socket.addConnection(sender, packet.host, packet.user, packet.id, packet.players)
		}

		// console.log('type: ' + type)
		// console.log('packet: ' + packet)
	}

	findGame(gameID) {
		for (var i in this.games)
			if (this.games[i].gameID == gameID)
				return this.games[i]

		return null
	}

	createGame(playerCount) {
		if (exists(playerCount)) {
			playerCount = Math.min(Math.max(playerCount, MIN_PLAYERS), MAX_PLAYERS)
		} else {
			playerCount = MAX_PLAYERS
		}

		// Create a game with an ID
		var id = this.generateSafeID()

		var game = new ServerGame(id, playerCount, this)
		this.games.push(game)
		console.log('Creating Game: ' + id + ' [' + playerCount + ']')

		return game
	}

	removeGame(game) {
		this.removeQueue(game)

		// Remove the game from the server
		var i = this.games.indexOf(game)
		if (i != -1) {
			this.games.splice(i, 1)
			console.log('Removing Game: ' + game.gameID)
		}
	}

	removeQueue(game) {
		// Remove the game from the queue
		var i = this.queuedGames.indexOf(game)
		if (i != -1) {
			this.queuedGames.splice(i, 1)
			console.log('Unqueueing Game: ' + game.gameID)
		}
	}

	queue(sock, name, playerCount) {
		// When queuing a player begin looking for existing queued games
		for (var i in this.queuedGames) {
			let game = this.queuedGames[i]

			// If the game has the player count being looked for
			let playerCountSatisfied = playerCount < 2 || game.maxPlayers == playerCount

			// If the player count is good and the player can be added to the game
			if (playerCountSatisfied && game.canAddPlayer()) {
				game.addPlayer(sock, name)
				return
			}
		}

		// If no game in the queue satisfied the requirements...
		let game = this.createGame(playerCount)
		game.addPlayer(sock, name)
		this.queuedGames.push(game)
		console.log('Queueing Game: ' + game.gameID)
	}

	// Generates an ID that no other game currently has
	generateSafeID() {
		while (true) {
			// Generates ID
			var id = ''
			for (var i = 0; i < ID_LENGTH; i++) {
				id += ID_CHARACTERS.charAt(Math.floor(Math.random() * ID_CHARACTERS.length))
			}
			// Makes sure it is safe
			if (this.findGame(id) == null) return id
		}
	}
}

module.exports = GameManager
