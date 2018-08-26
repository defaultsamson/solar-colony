const WebSocket = require('ws');
const express = require('express')
const https = require('https')
const fs = require('fs')

class SocketManager extends Object {
	constructor(gameManager) {
		super()

		this.server = gameManager
		this.connections = []
	}

	connect() {
		if (LOCAL_DEBUG) {
			this.wss = new WebSocket.Server({
				port: PORT
			})
		} else {
			// This line is from the Node.js HTTPS documentation.
			var options = {
				key: fs.readFileSync('/ssl/www_samsonclose_me.key'),
				cert: fs.readFileSync('/ssl/www_samsonclose_me.crt')
			}

			// Create a service (the app object is just a callback).
			var app = express()

			// Create an HTTPS service 
			var httpsServer = https.createServer(options, app).listen(PORT)

			this.wss = new WebSocket.Server({
				server: httpsServer
			})
		}

		let sm = this

		this.wss.on('connection', function connection(ws) {
			ws.on('open', function open() {
				//ws.send('opened');
			})

			ws.on('close', function close() {
				// Remove the connection
				try {
					sm.removeConnection(ws)
				} catch (err) {
					console.log(err)
				}
			})

			ws.on('error', function error(e) {
				// Remove the connection
				try {
					console.log('Error: ' + e.code);
					sm.removeConnection(ws)
				} catch (err) {
					console.log(err)
				}
			})

			ws.on('message', function incoming(msg) {
				try {
					var pack = JSON.parse(msg)
					sm.server.parse(ws, pack.type, pack)
				} catch (err) {
					console.log(err)
				}
			})
		})
	}

	removeConnection(sock) {
		var i = this.connections.indexOf(sock)
		if (i != -1) {
			this.connections.splice(i, 1)
		}

		if (sock.game) {
			sock.game.removePlayer(sock)
		}
	}

	addConnection(sock, host, name, id, playerCount) {
		if (!this.approved(sock)) {
			id = id ? id.toUpperCase() : ''

			// Test if the name is proper
			if (USERNAME_REGEX.test(name)) {
				// Test if no ID was given
				if (id == '') {

					if (host) {
						// Create new game and add a player to it
						this.connections.push(sock)
						this.server.createGame(playerCount).addPlayer(sock, name)

					} else {
						// Join a random game
						this.server.queue(this, sock, name, playerCount)
					}

					// If ID was given make sure it's proper
				} else if (ID_REGEX.test(id)) {
					let game = this.server.findGame(id)

					if (game) {

						checkName(game, sock, name)
					} else {
						// No game found with given ID
						var formPacket = {
							type: Pack.FORM_FAIL,
							reason: 'No existing game with ID ' + id
						}
						sock.send(JSON.stringify(formPacket))
					}
				} else {
					// Improper ID
					var formPacket = {
						type: Pack.FORM_FAIL,
						reason: 'Improper game ID provided'
					}
					sock.send(JSON.stringify(formPacket))
				}
			} else {
				// Improper name
				var formPacket = {
					type: Pack.FORM_FAIL,
					reason: 'Improper username provided'
				}
				sock.send(JSON.stringify(formPacket))
			}
		}
	}

	checkName(game, sock, name) {
		var allowName = true
		for (var i in game.players) {
			//console.log('name: ' + )
			if (game.players[i].name == name) {
				allowName = false
				break
			}
		}

		if (allowName) {
			this.connections.push(sock)

			game.addPlayer(sock, name)
		} else {
			// name already exists
			var formPacket = {
				type: Pack.FORM_FAIL,
				reason: 'A player with username ' + name + ' already exists'
			}
			sock.send(JSON.stringify(formPacket))
		}
	}

	approved(sock) {
		return sock.approved === true

		// Check if con is in this.connections
		/*for (var i in this.connections) {
			if (this.connections[i] === con) return true
		}
	return false*/
	}
}

module.exports = SocketManager
