const Orbit = require('../shared/Orbit.js')
const Planet = require('../shared/Planet.js')
const System = require('../shared/System.js')
const Team = require('../shared/Team.js')
const Timeskewer = require('./Timeskewer.js')

class Game extends Object {
	constructor(server, gameID, maxPlayers) {
		super()

		this.ids = 0

		this.server = server
		this.gameID = gameID
		this.maxPlayers = maxPlayers

		this.players = []
		this.teams = []

		this.redTeam = this.addTeam(new Team(0xFF8888, 0))
		this.purpleTeam = this.addTeam(new Team(0xBB88DD, 1))
		this.blueTeam = this.addTeam(new Team(0xAAAAFF, 2))
		this.greenTeam = this.addTeam(new Team(0xAAFFAA, 3))
		this.yellowTeam = this.addTeam(new Team(0xFFFF66, 4))
		this.orangeTeam = this.addTeam(new Team(0xFFAA55, 5))

		this.system = null
	}

	update(delta) {
		if (this.system) {
			this.system.update(delta)
		}

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
				// TODO more efficient way of switching teams than resending the list each time?
				this.getTeam(pack.team).addPlayer(sender)
				this.sendTeamPlayers()
				this.updatePlayerCount()

				var packet = {
					type: Pack.SET_CLIENT_TEAM,
					team: sender.team.id
				}
				sender.send(JSON.stringify(packet))
				break
				case Pack.UPDATE_START_BUTTON:
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
						var packet2 = {
							type: Pack.UPDATE_START_BUTTON,
							chosen: chosen,
							total: this.players.length
						}
						this.sendPlayers(packet2)
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

		addTeam(team) {
			this.teams.push(team)
			return team
		}

		getTeam(id) {
			for (var i in this.teams) {
				if (this.teams[i].id == id) {
					return this.teams[i]
				}
			}
			return null
		}

		sendTeams() {
			var pack = {
				type: Pack.CLEAR_TEAMS
			}
			this.sendPlayers(pack)

			for (var i in this.teams) {
				pack = {
					type: Pack.CREATE_TEAM,
					id: this.teams[i].id,
					colour: this.teams[i].colour
				}
				this.sendPlayers(pack)
			}
			this.sendTeamPlayers()
		}

		sendTeamPlayers() {
			var pack = {
				type: Pack.CLEAR_TEAM_GUI
			}
			this.sendPlayers(pack)

			for (var i in this.teams) {
				for (var j in this.teams[i].players) {
					pack = {
						type: Pack.POPULATE_TEAM,
						team: this.teams[i].id,
						name: this.teams[i].players[j].name
					}
					this.sendPlayers(pack)
				}
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
				player: this.players.length
			}
			sock.send(JSON.stringify(packet))

			this.updatePlayerCount()
			this.sendTeams()
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
			this.sendTeamPlayers()
			this.updatePlayerCount()
		} else {
			this.server.removeGame(this)
		}
	}

	updatePlayerCount() {
		var chosen = 0
		for (var i in this.players) {
			if (this.players[i].team != null) {
				chosen++
			}
		}

		var packet = {
			type: Pack.UPDATE_PLAYER_COUNT,
			chosen: chosen,
			total: this.players.length,
			max: this.maxPlayers
		}
		this.sendPlayers(packet)
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

		{
			// Rebuilds the teams 
			var tempTeams = []
			for (var i in this.teams) {
				if (this.teams[i].players.length > 0) {
					tempTeams.push(this.teams[i])
				}
			}
			this.teams = tempTeams

			// builds the player planets
			const planetCount = this.teams.length
			const rotation = 2 * Math.PI / planetCount
			for (var i = 0; i < planetCount; i++) {
				var planet = this.system.addPlanet(new Planet(190, 0.1, -1 / 6, rotation * i, 1))

				planet.setOrbit(orbit2)
				planet.createSpawn(true)
				planet.setTeam(this.teams[i])
			}
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

		this.sendPlayers({
			type: Pack.SHOW_SYSTEM
		})

		// starting sync and countdown for clients
		let ga = this

		for (var i = 0; i < COUNTDOWN_PACKET_SENDS; i++) {
			setTimeout(function () {
				ga.sendPlayers({
					type: Pack.START_GAME
				})
			}, (i + 1) * COUNTDOWN_INTERVAL) // i + 1 so that the first one won't immediately send
		}

		// start the game on server-side
		setTimeout(function () {
			ga.system.play()
		}, COUNTDOWN_TIME)
	}

	sendPlayers(obj) {
		let toSend = JSON.stringify(obj)
		for (var i in this.players) {
			this.players[i].send(toSend)
		}
	}

	/* Do we really need this?
	sendTeamByID(teamID, obj) {
		let toSend = JSON.stringify(obj)
		let team = this.getTeam(teamID)
		for (var i in team.players) {
			team.players[i].send(toSend)
		}
	}*/

	createID() {
		return this.ids++
	}
}

module.exports = Game
