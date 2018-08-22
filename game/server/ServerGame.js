const Orbit = require('../shared/Orbit.js')
const Planet = require('../shared/Planet.js')
const System = require('../shared/System.js')
const Team = require('../shared/Team.js')
const Timeskewer = require('./Timeskewer.js')
const Game = require('../shared/Game.js')

class ServerGame extends Game {
	constructor(gameID, maxPlayers, server) {
		super(gameID, maxPlayers)

		this.ids = 0

		this.server = server

		this.players = []

		this.redTeam = this.addTeam(new Team(Colour.RED, 0))
		this.orangeTeam = this.addTeam(new Team(Colour.ORANGE, 1))
		this.yellowTeam = this.addTeam(new Team(Colour.YELLOW, 2))
		this.greenTeam = this.addTeam(new Team(Colour.GREEN, 3))
		this.blueTeam = this.addTeam(new Team(Colour.BLUE, 4))
		this.purpleTeam = this.addTeam(new Team(Colour.PURPLE, 5))
	}

	update(delta) {
		super.update(delta)

		for (var i in this.players) {
			this.players[i].pinger.update(delta)
		}
	}

	parse(sender, type, pack) {
		switch (type) {
			case Pack.BUY_SHIPS:
				this.system.getPlanetByID(pack.pl).createShips(pack.n, pack.c)
				break
			case Pack.CREATE_SPAWN: // create spawn
				this.system.getPlanetByID(pack.pl).createSpawn()
				break
			case Pack.JOIN_TEAM:
				// Reset the start status
				for (var i in this.players) {
					this.players[i].start = false
				}
				// Remove the players from their previous team
				if (sender.team != null) {
					sender.team.removePlayer(sender)
				}
				// TODO more efficient way of switching teams than resending the list each time? e.g. deltas
				this.getTeam(pack.team).addPlayer(sender)
				this.updateTeams()

				var packet = {
					type: Pack.SET_CLIENT_TEAM,
					team: sender.team.id
				}
				sender.send(JSON.stringify(packet))
				break
			case Pack.START_BUTTON:
				// If the sender didn't start and the sender has a team
				if (!sender.start && sender.team) {
					sender.start = true
					var chosen = 0
					for (var i in this.players) {
						if (this.players[i].start) {
							chosen++
						}
					}

					// Start the game if there's more than two players and all players have chosen a team
					if (chosen >= MIN_PLAYERS && chosen == this.players.length) {
						this.start()
					} else {
						// Else tell the other players to choose
						this.updateSelectionMessages()
					}
				}
				break
			case Pack.QUIT:
				this.removePlayer(sender)
				sender.approved = false
				break
		}
	}

	canAddPlayer() {
		return this.players.length < this.maxPlayers
	}

	createTeams(sock) {
		var socks = exists(sock) ? [sock] : this.players

		var pack = {
			type: Pack.CREATE_TEAMS
		}

		pack.teams = []

		for (var i in this.teams) {
			pack.teams.push({
				id: this.teams[i].id,
				colour: this.teams[i].colour
			})
		}

		for (var i in socks) {
			var mess = JSON.stringify(pack)
			socks[i].send(mess)
		}

		this.updateTeams(sock)
	}

	updateTeams(sock) {
		var socks = exists(sock) ? [sock] : this.players

		var pack = {
			type: Pack.UPDATE_TEAMS
		}

		pack.teams = []

		for (var i in this.teams) {
			// Creates new team object
			var team = {
				id: this.teams[i].id
			}
			team.players = []

			// Adds the player names to this team
			for (var j in this.teams[i].players) {
				team.players.push(this.teams[i].players[j].name)
			}
			pack.teams.push(team)
		}

		for (var i in socks) {
			var mess = JSON.stringify(pack)
			socks[i].send(mess)
		}

		this.updateSelectionMessages(sock)
	}

	updateSelectionMessages(sock) {
		var socks = exists(sock) ? [sock] : this.players

		const total = this.players.length
		var started = 0
		for (var i in this.players) {
			if (this.players[i].start) {
				started++
			}
		}

		var pack = {
			type: Pack.UPDATE_MESSAGE,
			maxPlayers: this.maxPlayers,
			playerCount: this.players.length
		}

		// Customizes start text and button text
		for (var i in socks) {
			var team = socks[i].team
			pack.startEnabled = false
			pack.team = -1
			if (team) {
				pack.team = team.id
				if (total < MIN_PLAYERS) {
					var need = MIN_PLAYERS - total
					pack.message = need + ' more player' + (need != 1 ? 's' : '') + ' required to start game...'
				} else if (this.players[i].start) {
					if (total == started) {
						// Double checks to make sure that more than one team is populated populated
						var populatedTeams = 0
						for (var i in this.teams) {
							if (this.teams[i].players.length > 0) {
								populatedTeams++
							}
						}
						if (populatedTeams < 2) {
							pack.message = 'More than one team must be populated'
						}
					} else {
						var starting = total - started
						pack.message = 'Waiting for ' + starting + ' player' + (starting != 1 ? 's' : '') + ' to confirm teams (' + started + '/' + total + ')'
					}
				} else {
					pack.message = "Press start to begin with these teams"
					pack.startEnabled = true
				}
			} else {
				pack.message = "Click a colour to choose a team"
			}

			socks[i].send(JSON.stringify(pack))
		}
	}

	addPlayer(sock, name) {
		sock.name = name
		sock.game = this
		sock.approved = true
		sock.pinger = new Timeskewer(sock)
		this.players.push(sock)

		var packet = {
			type: Pack.JOIN_GAME,
			gameID: this.gameID,
			maxPlayers: this.maxPlayers
		}
		sock.send(JSON.stringify(packet))

		this.createTeams(sock)
		this.updateSelectionMessages()
	}

	removePlayer(sock) {
		if (sock.team) {
			sock.team.removePlayer(sock)
		}

		// Removes the player from the list of players
		var i = this.players.indexOf(sock)
		if (i != -1) {
			this.players.splice(i, 1)
		}

		// If there's still players left in the game
		if (this.players.length > 0) {
			// Update the teams for them
			// TODO may break if performed mid-game
			// TODO remove team if it is empty
			// TODO end game if only one team remaining
			// TODO pause game and wait for players?
			this.updateTeams()
		} else {
			this.server.removeGame(this)
		}
	}

	start() {
		console.log('Starting Game: ' + this.gameID)

		this.server.removeQueue(this)

		this.system = new System()
		this.system.game = this

		// Creates the system on the client-side
		var pack = {
			type: Pack.CREATE_SYSTEM
		}
		this.sendPlayers(pack)

		const orbit1 = this.system.addOrbit(new Orbit(0, 0, 150))
		const orbit2 = this.system.addOrbit(new Orbit(0, 0, 220))
		const orbit3 = this.system.addOrbit(new Orbit(0, 0, 270))
		const orbit4 = this.system.addOrbit(new Orbit(0, 0, 360))

		const planet1 = this.system.addPlanet(new Planet(190, 0.1, -1 / 4, Math.PI / 2, 2))

		this.rebuildTeams()

		// builds the player planets
		const planetCount = this.teams.length
		const rotation = 2 * Math.PI / planetCount
		for (var i = 0; i < planetCount; i++) {
			var planet = this.system.addPlanet(new Planet(190, 0.1, -1 / 6, rotation * i, 1))

			planet.setOrbit(orbit2)
			planet.setTeam(this.teams[i])
			planet.createSpawn(true)
		}

		const planet3 = this.system.addPlanet(new Planet(190, 0.1, 1 / 3, Math.PI / 4, 1 / 2))

		const planet4 = this.system.addPlanet(new Planet(190, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4))

		planet1.setOrbit(orbit1)

		planet3.setOrbit(orbit3)
		planet4.setOrbit(orbit4)

		for (var i in this.players) {
			var pack = {
				type: Pack.SET_CLIENT_TEAM,
				team: this.players[i].team.id
			}
			this.players[i].send(JSON.stringify(pack))
		}


		// Start all teams off with 100 pixels
		for (var i in this.teams)
			this.teams[i].setPixels(STARTING_PIXELS);

		this.sendPlayers({
			type: Pack.SHOW_SYSTEM
		})

		// starting sync and countdown for clients
		let ga = this

		for (var i = 0; i < COUNTDOWN_PACKET_SENDS; i++) {
			setTimeout(function() {
				ga.sendPlayers({
					type: Pack.START_GAME
				})
			}, (i + 1) * COUNTDOWN_INTERVAL) // i + 1 so that the first one won't immediately send
		}

		// start the game on server-side
		setTimeout(function() {
			ga.play()
		}, COUNTDOWN_TIME)
	}

	sendPlayers(obj) {
		let toSend = JSON.stringify(obj)
		for (var i in this.players) {
			this.players[i].send(toSend)
		}
	}

	createID() {
		return this.ids++
	}
}

module.exports = ServerGame
