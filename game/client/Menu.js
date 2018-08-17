class Menu extends Object {
	constructor() {
		super()

		this.serverFail = false
		this.formSent = false

		this.joinGame = false
		this.createGame = false

		this.randomGame = false
		this.withFriends = false

		this.username = ''
		this.gameID = ''
		this.players = 4

		this.nameGotGood = false
		this.idGotGood = false

		let me = this

		function hoverButton(elem) {
			elem.style.background = 'rgba(200, 200, 200, 0.5)'
		}

		function unhoverButton(elem) {
			elem.style.background = 'rgba(0, 0, 0, 0)'
		}

		// Adds the hover behaviours to all buttons
		for (var i in Elem.Button) {
			var elem = document.getElementById(Elem.Button[i])
			elem.setAttribute('touch', false)

			// Usual hover behaviour for mouse.
			// the 'touch' attribute is a little bit hacky, it's used to detect
			// finger taps vs. mouse clicks. The difference is the button should
			// stop hovering at the end of a finger tap, but should continue 
			// to hover at the end of a mouse click
			elem.addEventListener('mouseover', function(e) {
				if (e.target.getAttribute('touch') == 'false') {
					hoverButton(e.target)
				}
			}, false)
			elem.addEventListener('mouseleave', function(e) {
				unhoverButton(e.target)
				//e.target.setAttribute('touch', false)
			}, false)
			elem.addEventListener('touchstart', function(e) {
				if (e.target.getAttribute('enable_click') != 'false') {
					hoverButton(e.target)
				}
			}, false)
			elem.addEventListener('touchend', function(e) {
				unhoverButton(e.target)
				e.target.setAttribute('touch', true)
				setTimeout(function() {
					e.target.setAttribute('touch', false)
				}, 10)
			}, false)
			elem.addEventListener('mousedown', function(e) {
				if (e.target.getAttribute('enable_click') != 'false') {
					hoverButton(e.target)
					// if it was a touch tap, unhover it after 100ms
					if (e.target.getAttribute('touch') == 'true') {
						setTimeout(function() {
							unhoverButton(e.target)
						}, 100)
					}
				}
			}, false)
		}

		document.getElementById(Elem.Button.JOIN).onmousedown = function() {
			me.joinGame = true
			me.reateGame = false
			me.updateGuiClick()
		}

		document.getElementById(Elem.Button.CREATE).onmousedown = function() {
			me.joinGame = false
			me.createGame = true
			me.updateGuiClick()
		}

		document.getElementById(Elem.Button.RANDOM).onmousedown = function() {
			if (me.joinGame) {
				me.randomGame = true
				me.withFriends = false
				me.updateGuiClick()
			}
		}

		document.getElementById(Elem.Button.WITH_FRIENDS).onmousedown = function() {
			if (me.joinGame || me.createGame) {
				me.randomGame = false
				me.withFriends = true
				me.updateGuiClick()
			}
		}

		function playerCount(p) {
			console.log("playerCounr: " + p)
			me.players = p
			me.updateGuiClick()
		}

		document.getElementById(Elem.Button.PLAYERS_2).onmousedown = () => playerCount(2)
		document.getElementById(Elem.Button.PLAYERS_3).onmousedown = () => playerCount(3)
		document.getElementById(Elem.Button.PLAYERS_4).onmousedown = () => playerCount(4)
		document.getElementById(Elem.Button.PLAYERS_8).onmousedown = () => playerCount(8)
		document.getElementById(Elem.Button.PLAYERS_16).onmousedown = () => playerCount(16)
		document.getElementById(Elem.Button.ANY_PLAYERS).onmousedown = () => playerCount(-1)

		function joinTeam(i) {
			var pack = {
				type: Pack.JOIN_TEAM,
				team: i
			}
			socket.send(pack)
		}

		document.getElementById(Elem.Button.TEAM_RED).onmousedown = () => joinTeam(0)
		document.getElementById(Elem.Button.TEAM_ORANGE).onmousedown = () => joinTeam(1)
		document.getElementById(Elem.Button.TEAM_YELLOW).onmousedown = () => joinTeam(2)
		document.getElementById(Elem.Button.TEAM_GREEN).onmousedown = () => joinTeam(3)
		document.getElementById(Elem.Button.TEAM_BLUE).onmousedown = () => joinTeam(4)
		document.getElementById(Elem.Button.TEAM_PURPLE).onmousedown = () => joinTeam(5)

		document.getElementById(Elem.Button.START).onmousedown = function() {
			if (inTeamSelection) {
				var pack = {
					type: Pack.START_BUTTON
				}
				socket.send(pack)
				//disableButton(Elem.Button.START)
			} else {
				if (me.updateStartButton())
					me.sendForm()
			}
		}

		document.getElementById(Elem.Button.QUIT).onmousedown = function() {
			me.gotoTitle()
			var pack = {
				type: Pack.QUIT
			}
			socket.send(pack)
		}

		document.getElementById(Elem.Button.BUY_SPAWN).onmousedown = function() {
			if (exists(focusPlanet))
				focusPlanet.createSpawnClick()
		}

		function buyShips(num, price) {
			if (exists(focusPlanet))
				focusPlanet.createShipsClick(num, price)
		}

		document.getElementById(Elem.Button.BUY_SHIPS_1000).onmousedown = () => buyShips(1000, 800)
		document.getElementById(Elem.Button.BUY_SHIPS_100).onmousedown = () => buyShips(100, 90)
		document.getElementById(Elem.Button.BUY_SHIPS_10).onmousedown = () => buyShips(10, 10)

		document.getElementById(Elem.Input.USERNAME).onkeyup = () => { me.updateStartButton() }
		document.getElementById(Elem.Input.ID).onkeyup = () => { me.updateStartButton() }

		document.onkeypress = function(e) {
			var keyCode = e.keyCode
			if (isButtonEnabled(Elem.Button.START)) {
				var txt = String.fromCharCode(e.which)

				if (keyCode == Key.ENTER) {
					if (!USERNAME_REGEX.test(getInput(Elem.Input.USERNAME))) {} else if (me.joinGame && me.withFriends && !ID_REGEX.test(getInput(Elem.Input.ID))) {

					} else if (updateStartButton()) {
						me.sendForm()
						e.preventDefault()
						return false
					} else {
						e.preventDefault()
						return false
					}
				} else if (!ACCEPTABLE_REGEX.test(txt)) {
					if (keyCode == Key.BACKSPACE || keyCode == Key.DELETE || keyCode == Key.TAB || keyCode == Key.ESCAPE || keyCode == Key.ENTER || keyCode == Key.CTRL || keyCode == Key.SHIFT || keyCode == Key.CMD || keyCode == Key.ALT || keyCode == Key.F1 || keyCode == Key.F2 || keyCode == Key.F3 || keyCode == Key.F4 || keyCode == Key.F5 || keyCode == Key.F6 || keyCode == Key.F7 || keyCode == Key.F8 || keyCode == Key.F9 || keyCode == Key.F10 || keyCode == Key.F11 || keyCode == Key.F12) {

					} else {
						// console.log(txt + ' : ' + e.which)
						e.preventDefault()
						return false
					}
				}
			} else if (keyCode == Key.ENTER) {
				e.preventDefault()
				return false
			}
		}

		this.hide()
		setVisible(INPUT_DIV)
		setVisible(TOP_DIV)
	}

	gotoTitle() {

		allowMouseClick = true
		inTeamSelection = false

		if (system) {
			viewport.removeChild(system)
			system = null
		}

		this.formSent = false

		this.hide()
		setVisible(Elem.Text.CONNECTION_MESSAGE, !socket.connected)

		this.updateGuiClick()
	}

	updateGuiClick() {
		// Decides whether to stop showing the gui or continue
		var showRest = true

		setVisible(Elem.Button.JOIN)
		setVisible(Elem.Button.CREATE)

		enableButton(Elem.Button.RANDOM)
		if (this.joinGame) {
			selectButton(Elem.Button.JOIN)
			deselectButton(Elem.Button.CREATE)
		} else if (this.createGame) {
			deselectButton(Elem.Button.JOIN)
			selectButton(Elem.Button.CREATE)

			this.randomGame = false
			this.withFriends = true
			disableButton(Elem.Button.RANDOM)

		} else {
			deselectButton(Elem.Button.CREATE)
			deselectButton(Elem.Button.JOIN)
			showRest = false
		}

		// Show the rest of the menu?
		if (showRest) {
			setVisible(Elem.Button.RANDOM)
			setVisible(Elem.Button.WITH_FRIENDS)
		} else {
			setHidden(Elem.Button.RANDOM)
			setHidden(Elem.Button.WITH_FRIENDS)
		}

		if (this.randomGame) {
			selectButton(Elem.Button.RANDOM)
			deselectButton(Elem.Button.WITH_FRIENDS)
		} else if (this.withFriends) {
			deselectButton(Elem.Button.RANDOM)
			selectButton(Elem.Button.WITH_FRIENDS)
		} else {
			deselectButton(Elem.Button.RANDOM)
			deselectButton(Elem.Button.WITH_FRIENDS)
			showRest = false
		}

		// Show the rest of the menu?
		if (showRest) {
			setVisible(Elem.Text.USERNAME)
			setVisible(Elem.Input.USERNAME)

			setVisible(Elem.Text.ID, this.joinGame && this.withFriends)
			setVisible(Elem.Input.ID, this.joinGame && this.withFriends)

			setVisible(Elem.Text.PLAYERS, this.randomGame)
			setVisible(Elem.Button.PLAYERS_2, this.randomGame)
			setVisible(Elem.Button.PLAYERS_3, this.randomGame)
			setVisible(Elem.Button.PLAYERS_4, this.randomGame)
			setVisible(Elem.Button.PLAYERS_8, this.randomGame)
			setVisible(Elem.Button.PLAYERS_16, this.randomGame)
			setVisible(Elem.Button.ANY_PLAYERS, this.randomGame)

			if (this.randomGame) {
				deselectButton(Elem.Button.PLAYERS_2)
				deselectButton(Elem.Button.PLAYERS_3)
				deselectButton(Elem.Button.PLAYERS_4)
				deselectButton(Elem.Button.PLAYERS_8)
				deselectButton(Elem.Button.PLAYERS_16)
				deselectButton(Elem.Button.ANY_PLAYERS)

				switch (this.players) {
					default: selectButton(Elem.Button.ANY_PLAYERS)
					break
					case 2:
							selectButton(Elem.Button.PLAYERS_2)
						break
					case 3:
							selectButton(Elem.Button.PLAYERS_3)
						break
					case 4:
							selectButton(Elem.Button.PLAYERS_4)
						break
					case 8:
							selectButton(Elem.Button.PLAYERS_8)
						break
					case 16:
							selectButton(Elem.Button.PLAYERS_16)
						break
				}
			}

			setVisible(Elem.Button.START)
			this.updateStartButton()

		} else {
			setHidden(Elem.Text.USERNAME)
			setHidden(Elem.Input.USERNAME)
			setHidden(Elem.Text.ID)
			setHidden(Elem.Input.ID)

			setHidden(Elem.Button.PLAYERS_2)
			setHidden(Elem.Button.PLAYERS_3)
			setHidden(Elem.Button.PLAYERS_4)
			setHidden(Elem.Button.PLAYERS_8)
			setHidden(Elem.Button.PLAYERS_16)
			setHidden(Elem.Button.ANY_PLAYERS)

			setHidden(Elem.Button.START)
		}
	}

	updateStartButton() {
		if (this.formSent) {
			disableButton(Elem.Button.START)
			return false
		} else if (this.randomGame || this.withFriends) {
			setHidden(Elem.Image.USERNAME_CHECK)
			setHidden(Elem.Image.USERNAME_CROSS)
			setHidden(Elem.Image.ID_CHECK)
			setHidden(Elem.Image.ID_CROSS)

			let nameCheck = USERNAME_REGEX.test(getInput(Elem.Input.USERNAME))
			if (nameCheck) {
				setVisible(Elem.Image.USERNAME_CHECK)
				this.nameGotGood = true
			} else if (this.nameGotGood) {
				setVisible(Elem.Image.USERNAME_CROSS)
			}

			let idRequired = this.joinGame && this.withFriends
			let idCheck
			if (idRequired) {
				idCheck = ID_REGEX.test(getInput(Elem.Input.ID))
				if (idCheck) {
					setVisible(Elem.Image.ID_CHECK)
					this.idGotGood = true
				} else if (this.idGotGood) {
					setVisible(Elem.Image.ID_CROSS)
				}
			}

			// TODO remove this? double check where it's used
			if (!this.serverFail) {
				setHidden(Elem.Text.MESSAGE)
			}

			// If the Join/Create game and Random/Friend buttons have been selected

			if (nameCheck) {
				if (!idRequired || idCheck) {
					if (socket.connected) {
						enableButton(Elem.Button.START)
						return true
					}
				} else if (this.idGotGood) {
					failSendForm('Game ID must be 6 characters, letters and numbers only')
				}
			} else if (this.nameGotGood) {
				failSendForm('Username must be 3-20 characters, letters and numbers only')
			}
			disableButton(Elem.Button.START)
			return false
		}
	}

	failSendForm(message) {
		setText(Elem.Text.MESSAGE, message)
		setVisible(Elem.Text.MESSAGE)
		if (this.formSent) {
			this.serverFail = true
			this.formSent = false
		} else {
			this.serverFail = false
		}
	}

	sendForm() {
		setText(Elem.Text.MESSAGE, 'Joining game...')
		setVisible(Elem.Text.MESSAGE)

		let sendID = this.joinGame && this.withFriends

		var formPacket = {
			type: Pack.FORM_SEND,
			host: this.createGame,
			user: getInput(Elem.Input.USERNAME),
			id: sendID ? getInput(Elem.Input.ID) : '',
			players: this.players
		}

		socket.send(formPacket)

		this.formSent = true
	}

	hide() {
		for (var i in Elem)
			for (var j in Elem[i])
				setHidden(Elem[i][j]);
	}

	// Thanks to https://css-tricks.com/scaled-proportional-blocks-with-css-and-javascript/
	// https://codepen.io/chriscoyier/pen/VvRoWy
	resize() {
		const guiX = INPUT_WIDTH
		const guiY = INPUT_HEIGHT
		const scaleX = window.innerWidth / guiX
		const scaleY = window.innerHeight / guiY

		var scale
		// viewport is too tall so limit by width
		if (scaleX < scaleY) {
			scale = scaleX

		} else { // limit by height
			scale = scaleY
		}

		// Scale the desktop version to be smaller
		if (!IS_MOBILE) {
			scale *= DESKTOP_SCALE
		}
		// scale = Math.max(scale, 0.5)

		document.getElementById(INPUT_DIV).style.transform = 'translate(-50%, -50%) ' + 'scale(' + scale + ')'
		document.getElementById(TOP_DIV).style.transform = 'scale(' + scale + ')'
	}
}
