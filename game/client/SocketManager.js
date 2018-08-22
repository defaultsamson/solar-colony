class SocketManager extends Object {
	constructor() {
		super()

		this.ws = null
		this.connectionAttempts = -1
		this.connected = false
	}

	connect(secure) {
		setVisible(Elem.Text.CONNECTION_MESSAGE)

		var ip
		if (LOCAL_DEBUG) {
			try {
				// Gets the IP from the browser (makes LAN connections for phones, laptops etc easier)
				ip = location.host.split(':')[0]
			} catch (err) {
				ip = 'localhost'
			}
		} else {
			ip = 'samsonclose.me'
		}

		secure = exists(secure) ? secure : !LOCAL_DEBUG

		if (secure) {
			this.ws = new WebSocket('wss://' + ip + ':' + PORT)
		} else {
			this.ws = new WebSocket('ws://' + ip + ':' + PORT)
		}

		let me = this

		this.ws.onerror = function(evt) {
			console.log('The WebSocket experienced an error')
			console.log(evt)
		}

		this.ws.onclose = function(evt) {
			console.log('The WebSocket was closed [' + evt.code + '] (' + evt.reason + ')')

			if (me.connected) {
				menu.gotoTitle()
			}

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
				// console.log('The WebSocket was messaged [' + evt.origin + '] (' + evt.data + ')')
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
				socket.send(pPack)
				break

			case Pack.PING_SET:
				ping = pack.ping
				setText(Elem.Text.PING, 'Ping: ' + ping + 'ms')
				break

			case Pack.UPDATE_PIXELS: // update pixel count
				game.myTeam.setPixels(pack.pl)
				break

			case Pack.BUY_SHIPS: // buy ships
				system.getPlanetByID(pack.pl).createShips(pack.n)
				break

			case Pack.FORM_FAIL:
				menu.failSendForm(pack.reason)
				break

			case Pack.JOIN_GAME:
				menu.hide()

				countDown = COUNTDOWN_TIME
				inTeamSelection = true

				game = new Game(pack.gameID, pack.maxPlayers)

				setVisible(Elem.Button.START)
				setVisible(Elem.Button.QUIT)

				setVisible(Elem.Text.ID_DISPLAY1)
				setVisible(Elem.Text.ID_DISPLAY2)
				setText(Elem.Text.ID_DISPLAY2, game.gameID)

				setVisible(Elem.Button.TEAM_RED)
				setVisible(Elem.Button.TEAM_ORANGE)
				setVisible(Elem.Button.TEAM_YELLOW)
				setVisible(Elem.Button.TEAM_GREEN)
				setVisible(Elem.Button.TEAM_BLUE)
				setVisible(Elem.Button.TEAM_PURPLE)

				setVisible(Elem.List.TEAM_RED)
				setVisible(Elem.List.TEAM_ORANGE)
				setVisible(Elem.List.TEAM_YELLOW)
				setVisible(Elem.List.TEAM_GREEN)
				setVisible(Elem.List.TEAM_BLUE)
				setVisible(Elem.List.TEAM_PURPLE)

				setVisible(Elem.Text.PING)
				break

			case Pack.CREATE_SYSTEM:
				system = new System()
				break

			case Pack.CREATE_ORBIT:
				var orbit = new Orbit(pack.x, pack.y, pack.radius)
				orbit.id = pack.id
				system.addOrbit(orbit)
				break

			case Pack.CREATE_PLANET:
				var planet = new Planet(resources.planet1.texture, pack.scale, pack.rotationConstant, pack.startAngle, pack.opm)
				planet.id = pack.id
				system.addPlanet(planet)
				break

			case Pack.SET_PLANET_ORBIT:
				var planet = system.getPlanetByID(pack.planet)
				var orbit = system.getOrbit(pack.orbit)
				planet.setOrbit(orbit)
				break

			case Pack.CREATE_SPAWN:
				var planet = system.getPlanetByID(pack.planet)

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
				var planet = system.getPlanetByID(pack.planet)
				var team = game.getTeam(pack.team)
				planet.setTeam(team)
				break

			case Pack.SHOW_SYSTEM:
				viewport.addChild(system)
				menu.hide()
				setVisible(Elem.Text.PING)
				setVisible(Elem.Text.PIXELS)
				setVisible(Elem.Text.SHIPS)

				// A little hack to get planets to go to their correct positions when the game starts
				system.play() // This lets us update the planets
				system.update(0) // this updates them from their default pos
				system.pause() // This reverts the game state to being paused

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
					system.play()
					system.update(ping / 1000) // fast forward based on our ping

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
					game.teams.push(new Team(colour, id))
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
	}
}
