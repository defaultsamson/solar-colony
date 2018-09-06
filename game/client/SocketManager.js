class SocketManager extends Object {
	constructor() {
		super()

		this.ws = null
		this.ping = 200
		this.countDown
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
				this.ping = pack.ping
				setText(Elem.Text.PING, 'Ping: ' + this.ping + 'ms')
				break

			case Pack.FORM_FAIL:
				menu.failSendForm(pack.reason)
				break

			case Pack.JOIN_GAME:
				game = new ClientGame(pack.gameID, pack.maxPlayers)
				menu.gotoTeamSelection()
				break

			case Pack.CREATE_SYSTEM:
				game.system = System.load(pack.sys, game)

				viewport.addChild(game.system)
				menu.hide()
				setVisible(Elem.Text.PING)
				setVisible(Elem.Text.PIXELS)
				setVisible(Elem.Text.SHIPS)

				// A little hack to get planets to go to their correct positions when the game starts
				game.play() // This lets us update the planets
				game.update(0) // this updates them from their default pos
				game.pause() // This reverts the game state to being paused

				setText(Elem.Text.COUNTDOWN, 'Starting Game soon...')
				setVisible(Elem.Text.COUNTDOWN)

				// TODO may not need to resume these?
				// they may not be paused
				viewport.resumePlugin('drag')
				viewport.resumePlugin('pinch')
				viewport.resumePlugin('wheel')
				viewport.moveCenter(0, 0)
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
				document.getElementById(Elem.List.TEAM_RED).innerHTML = ''
				document.getElementById(Elem.List.TEAM_ORANGE).innerHTML = ''
				document.getElementById(Elem.List.TEAM_YELLOW).innerHTML = ''
				document.getElementById(Elem.List.TEAM_GREEN).innerHTML = ''
				document.getElementById(Elem.List.TEAM_BLUE).innerHTML = ''
				document.getElementById(Elem.List.TEAM_PURPLE).innerHTML = ''

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
				if (!(game && game.system)) {
					enableButton(Elem.Button.START, pack.startEnabled)

					setVisible(Elem.Text.MESSAGE)
					setText(Elem.Text.MESSAGE, pack.message)

					setVisible(Elem.Text.PLAYER_COUNT)
					setText(Elem.Text.PLAYER_COUNT, 'Players: (' + pack.playerCount + '/' + pack.maxPlayers + ')')
				}

				// TODO put this in the UPDATE_TEAMS section??
				game.myTeam = game.getTeam(pack.team)
				break
			default:
				game.parse(type, pack)
		}
	}
}
