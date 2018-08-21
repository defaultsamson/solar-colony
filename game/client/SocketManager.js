class SocketManager extends Object {
	constructor() {
		super()

		this.ws = null
		this.connectionAttempts = 0
		this.connected = false

		if (LOCAL_DEBUG) {
			try {
				// Gets the IP from the browser (makes LAN connections for phones, laptops etc easier)
				this.ip = location.host.split(':')[0]
			} catch (err) {
				this.ip = 'localhost'
			}
		} else {
			this.ip = 'samsonclose.me'
		}
	}

	connect(secure) {
		setVisible(Elem.Text.CONNECTION_MESSAGE)

		secure = exists(secure) ? secure : !LOCAL_DEBUG

		if (secure) {
			this.ws = new WebSocket('wss://' + this.ip + ':' + PORT)
		} else {
			this.ws = new WebSocket('ws://' + this.ip + ':' + PORT)
		}

		let me = this

		this.ws.onerror = function(evt) {
			console.log('The WebSocket experienced an error')
			console.log(evt)
		}

		this.ws.onclose = function(evt) {
			console.log('The WebSocket was closed [' + evt.code + '] (' + evt.reason + ')')

			if (me.connected) menu.gotoTitle()

			me.connectionAttempts++
				me.connected = false

			menu.formSent = false
			menu.updateStartButton()

			me.connect()
		}

		this.ws.onopen = function(evt) {
			console.log('The WebSocket was opened succesfully!')

			me.connectionAttempts = -1
			me.connected = true
			setHidden(Elem.Text.CONNECTION_MESSAGE)
			menu.formSent = false
			menu.updateStartButton()
		}

		this.ws.onmessage = function(evt) {
			try {
				//console.log('The WebSocket was messaged [' + evt.origin + '] (' + evt.data + ')')
				var pack = JSON.parse(evt.data)
				me.parse(pack.type, pack)
			} catch (err) {
				console.log(err)
			}
		}
	}

	send(json) {
		this.ws.send(JSON.stringify(json))
	}

	parse(type, pack) {
		switch (type) {
			case Pack.PING_PROBE:
				let pPack = {
					type: Pack.PING_PROBE,
				}
				this.send(pPack)
				break

			case Pack.PING_SET:
				ping = pack.ping
				setText(Elem.Text.PING, 'Ping: ' + ping + 'ms')
				break

			case Pack.UPDATE_PIXELS: // update pixel count
				game.myTeam.setPixels(pack.pl)
				break

			case Pack.BUY_SHIPS: // buy ships
				game.system.getPlanetByID(pack.pl).createShips(pack.n)
				break

			case Pack.FORM_FAIL:
				menu.failSendForm(pack.reason)
				break

			case Pack.JOIN_GAME:

				countDown = COUNTDOWN_TIME

				game = new ClientGame(pack.gameID, pack.maxPlayers)

				menu.showTeamSelection()
				break

			case Pack.CREATE_SPAWN:
				var planet = game.system.getPlanetByID(pack.planet)

				if (pack.force) {
					planet.createSpawn(true)
				} else {
					// 1. subtract the counter that has happened while this packet sent
					// 2. update the spawn counter by creating a spawn
					// 3. push the spawn counter forward by the new rate
					planet.spawnCounter -= planet.spawnRate * ping * 0.001
					planet.createSpawn(false)
					planet.spawnCounter += planet.spawnRate * ping * 0.001
				}

				break

			case Pack.SET_PLANET_TEAM:
				var planet = game.system.getPlanetByID(pack.planet)
				var team = game.getTeam(pack.team)
				planet.setTeam(team)
				break

			case Pack.CREATE_SYSTEM:
				game.system = new System(game)

				for (var i in pack.orbits) {
					var orb = pack.orbits[i]
					var orbit = new Orbit(game, orb.x, orb.y, orb.radius)
					orbit.id = orb.id
					game.system.addOrbit(orbit)

					for (var j in orb.planets) {
						var pla = orb.planets[j]
						var planet = new Planet(game, game.system, pla.radius, pla.rotationConstant, pla.startAngle, pla.opm)
						planet.id = pla.id
						planet.team = game.getTeam(pla.team)
						orbit.addPlanet(planet)

					}
				}

				// var system = systemFromJSON(game, pack.sys)
				viewport.addChild(game.system)
				//game.system = system
				//console.log("parent: " + system.parent)
				menu.hide()
				setVisible(Elem.Text.PING)
				setVisible(Elem.Text.PIXELS)
				setVisible(Elem.Text.SHIPS)

				// A little hack to get planets to go to their correct positions when the game starts
				game.play() // This lets us update the planets
				game.update(0) // this updates them from their default pos
				game.pause() // This reverts the game state to being paused

				setText(Elem.Text.COUNTDOWN, 'Starting Game in ' + Math.ceil(countDown / 1000))
				setVisible(Elem.Text.COUNTDOWN)

				viewport.pausePlugin('drag')
				viewport.pausePlugin('pinch')
				viewport.pausePlugin('wheel')
				allowMouseClick = false
				break

			case Pack.START_GAME:
				inTeamSelection = false
				countDown -= COUNTDOWN_INTERVAL
				setText(Elem.Text.COUNTDOWN, 'Starting Game in ' + Math.ceil(countDown / 1000))

				if (countDown <= 0) {
					game.play()
					game.update(ping / 1000) // fast forward based on our ping

					setHidden(Elem.Text.COUNTDOWN)

					viewport.resumePlugin('drag')
					viewport.resumePlugin('pinch')
					viewport.resumePlugin('wheel')
					allowMouseClick = true
				}
				break

			case Pack.CREATE_TEAMS:
				game.teams = []
				for (var i in pack.teams) {
					var id = pack.teams[i].id
					var colour = pack.teams[i].colour
					game.addTeam(new Team(colour, id))
				}
				break

			case Pack.UPDATE_TEAMS:
				// Clear the GUI
				document.getElementById(Elem.List.TEAM_RED).innerHTML = '';
				document.getElementById(Elem.List.TEAM_ORANGE).innerHTML = '';
				document.getElementById(Elem.List.TEAM_YELLOW).innerHTML = '';
				document.getElementById(Elem.List.TEAM_GREEN).innerHTML = '';
				document.getElementById(Elem.List.TEAM_BLUE).innerHTML = '';
				document.getElementById(Elem.List.TEAM_PURPLE).innerHTML = '';

				// Clears the players from the teams
				for (var i in game.teams) {
					game.teams[i].players = []
				}

				for (var i in pack.teams) {
					// Team Object and teamID
					var team = pack.teams[i]
					var teamID = team.id
					var teamObj = game.getTeam(teamID)
					for (var j in team.players) {
						// player name
						var name = team.players[j]

						// Adds new player object to the team object
						teamObj.addPlayer(new Player(name))

						var list
						// Chooses a list to add the player to based on ID
						switch (teamID) {
							case 0:
								list = document.getElementById(Elem.List.TEAM_RED)
								break
							case 1:
								list = document.getElementById(Elem.List.TEAM_ORANGE)
								break
							case 2:
								list = document.getElementById(Elem.List.TEAM_YELLOW)
								break
							case 3:
								list = document.getElementById(Elem.List.TEAM_GREEN)
								break
							case 4:
								list = document.getElementById(Elem.List.TEAM_BLUE)
								break
							case 5:
								list = document.getElementById(Elem.List.TEAM_PURPLE)
								break
						}

						// Creates the HTML list entry for the GUI
						var entry = document.createElement('li');
						entry.appendChild(document.createTextNode(name));
						list.appendChild(entry);
					}
				}

				break

			case Pack.UPDATE_MESSAGE:
				enableButton(Elem.Button.START, pack.startEnabled)

				setVisible(Elem.Text.MESSAGE)
				setText(Elem.Text.MESSAGE, pack.message)

				setVisible(Elem.Text.PLAYER_COUNT)
				setText(Elem.Text.PLAYER_COUNT, 'Players: (' + pack.playerCount + '/' + pack.maxPlayers + ')')

				game.myTeam = game.getTeam(pack.team)

				break
		}

		//console.log('type: ' + type)myTeam
		//console.log('pack: ' + JSON.stringify(pack))
	}
}
