// To be completely honest, most of this code is spaghetti, but the menu works sooo... :/

var connectionAttempts = -1
var connected = false

function connect() {

	setVisible(CONNECTION_TEXT)

	var ws = socket.connect()

	ws.onerror = function (evt) {
		console.log('The WebSocket experienced an error')
		console.log(evt)
	}

	ws.onclose = function (evt) {
		console.log('The WebSocket was closed [' + evt.code + '] (' + evt.reason + ')')

		if (connected) {
			gotoTitle()
		}

		connectionAttempts++
		connected = false

		formSent = false
		updateStartButton()

		connect()
	}

	ws.onopen = function (evt) {
		console.log('The WebSocket was opened succesfully!')

		connectionAttempts = -1
		connected = true
		setHidden(CONNECTION_TEXT)
		formSent = false
		updateStartButton()
	}

	ws.onmessage = function (evt) {
		try {
			// console.log('The WebSocket was messaged [' + evt.origin + '] (' + evt.data + ')')
			var pack = JSON.parse(evt.data)
			parse(pack.type, pack)
		} catch (err) {
			console.log(err)
		}
	}
}

function gotoTitle() {

	allowMouseClick = true
	inTeamSelection = false

	if (system) {
		viewport.removeChild(system)
		system = null
	}

	hud.hideAll()

	formSent = false
	shownStart = false

	hideMenu()
	connected ? setHidden(CONNECTION_TEXT) : setVisible(CONNECTION_TEXT)

	updateGuiClick()
}

var shownStart = false
var serverFail = false
var formSent = false

var joinGame = false
var createGame = false

var randomGame = false
var withFriends = false

var username = ''
var gameID = ''
var players = 4

function updateGuiClick() {
	// Decides whether to stop showing the gui or continue
	var showRest = true

	setVisible(JOIN_GAME_BUTTON)
	setVisible(CREATE_GAME_BUTTON)

	enableButton(RANDOM_GAME_BUTTON)
	if (joinGame) {
		selectButton(JOIN_GAME_BUTTON)
		deselectButton(CREATE_GAME_BUTTON)
	} else if (createGame) {
		deselectButton(JOIN_GAME_BUTTON)
		selectButton(CREATE_GAME_BUTTON)

		randomGame = false
		withFriends = true
		disableButton(RANDOM_GAME_BUTTON)

	} else {
		deselectButton(CREATE_GAME_BUTTON)
		deselectButton(JOIN_GAME_BUTTON)
		showRest = false
	}

	// Show the rest of the menu?
	if (showRest) {
		setVisible(RANDOM_GAME_BUTTON)
		setVisible(WITH_FRIENDS_BUTTON)
	} else {
		setHidden(RANDOM_GAME_BUTTON)
		setHidden(WITH_FRIENDS_BUTTON)
	}

	if (randomGame) {
		selectButton(RANDOM_GAME_BUTTON)
		deselectButton(WITH_FRIENDS_BUTTON)
	} else if (withFriends) {
		deselectButton(RANDOM_GAME_BUTTON)
		selectButton(WITH_FRIENDS_BUTTON)
	} else {
		deselectButton(RANDOM_GAME_BUTTON)
		deselectButton(WITH_FRIENDS_BUTTON)
		showRest = false
	}

	// Show the rest of the menu?
	if (showRest) {
		setVisible(USERNAME_TEXT)
		setVisible(USERNAME_INPUT)

		setVisible(ID_TEXT, joinGame && withFriends)
		setVisible(ID_INPUT, joinGame && withFriends)

		setVisible(PLAYER_COUNT_TEXT, randomGame)
		setVisible(PLAYERS_BUTTON_2, randomGame)
		setVisible(PLAYERS_BUTTON_3, randomGame)
		setVisible(PLAYERS_BUTTON_4, randomGame)
		setVisible(PLAYERS_BUTTON_8, randomGame)
		setVisible(PLAYERS_BUTTON_16, randomGame)
		setVisible(PLAYERS_BUTTON_RANDOM, randomGame)

		if (randomGame) {
			deselectButton(PLAYERS_BUTTON_2)
			deselectButton(PLAYERS_BUTTON_3)
			deselectButton(PLAYERS_BUTTON_4)
			deselectButton(PLAYERS_BUTTON_8)
			deselectButton(PLAYERS_BUTTON_16)
			deselectButton(PLAYERS_BUTTON_RANDOM)

			switch (players) {
				default: selectButton(PLAYERS_BUTTON_RANDOM)
				break
				case 2:
				selectButton(PLAYERS_BUTTON_2)
				break
				case 3:
				selectButton(PLAYERS_BUTTON_3)
				break
				case 4:
				selectButton(PLAYERS_BUTTON_4)
				break
				case 8:
				selectButton(PLAYERS_BUTTON_8)
				break
				case 16:
				selectButton(PLAYERS_BUTTON_16)
				break
			}
		}

		setVisible(START_BUTTON)
		updateStartButton()

	} else {
		setHidden(USERNAME_TEXT)
		setHidden(USERNAME_INPUT)
		setHidden(ID_TEXT)
		setHidden(ID_INPUT)

		setHidden(PLAYER_COUNT_TEXT)
		setHidden(PLAYERS_BUTTON_2)
		setHidden(PLAYERS_BUTTON_3)
		setHidden(PLAYERS_BUTTON_4)
		setHidden(PLAYERS_BUTTON_8)
		setHidden(PLAYERS_BUTTON_16)
		setHidden(PLAYERS_BUTTON_RANDOM)

		setHidden(START_BUTTON)
	}
}

function joinButton() {
	joinGame = true
	createGame = false
	updateGuiClick()
}

function createButton() {
	joinGame = false
	createGame = true
	updateGuiClick()
}

function randomButton() {
	if (joinGame) {
		randomGame = true
		withFriends = false
		updateGuiClick()
	}
}

function friendsButton() {
	if (joinGame || createGame) {
		randomGame = false
		withFriends = true
		updateGuiClick()
	}
}

function playerCount(p) {
	players = p
	updateGuiClick()
}

function joinTeam(i) {
	var pack = {
		type: Pack.JOIN_TEAM,
		team: i
	}
	socket.ws.send(JSON.stringify(pack))
}

function startButton() {
	if (inTeamSelection) {
		var pack = {
			type: Pack.UPDATE_START_BUTTON
		}
		socket.ws.send(JSON.stringify(pack))
		//disableButton(START_BUTTON)
	} else {
		if (updateStartButton())
			sendForm()
	}
}

function quitButton() {
	gotoTitle()
	var pack = {
		type: Pack.QUIT
	}
	socket.ws.send(JSON.stringify(pack))
}

var nameGotGood = false
var idGotGood = false

function updateStartButton() {

	if (formSent) {
		disableButton(START_BUTTON)
		return false
	} else if (randomGame || withFriends) {
		setHidden(USERNAME_CHECK)
		setHidden(USERNAME_CROSS)
		setHidden(ID_CHECK)
		setHidden(ID_CROSS)

		let nameCheck = /^([A-Za-z0-9]{3,20})$/.test(getInput(USERNAME_INPUT))
		if (nameCheck) {
			setVisible(USERNAME_CHECK)
			nameGotGood = true
		} else if (nameGotGood) {
			setVisible(USERNAME_CROSS)
		}

		let idRequired = joinGame && withFriends
		let idCheck
		if (idRequired) {
			idCheck = /^([A-Za-z0-9]{6})$/.test(getInput(ID_INPUT))
			if (idCheck) {
				setVisible(ID_CHECK)
				idGotGood = true
			} else if (idGotGood) {
				setVisible(ID_CROSS)
			}
		}

		// TODO remove this? double check where it's used
		if (!serverFail) {
			setHidden(MESSAGE_TEXT)
		}

		// If the Join/Create game and Random/Friend buttons have been selected

		if (nameCheck) {
			if (!idRequired || idCheck) {
				if (connected) {
					enableButton(START_BUTTON)
					return true
				}
			} else if (idGotGood) {
				failSendForm('Game ID must be 6 characters, letters and numbers only')
			}
		} else if (nameGotGood) {
			failSendForm('Username must be 3-20 characters, letters and numbers only')
		}
		disableButton(START_BUTTON)
		return false
	}
}

document.onkeypress = function keyDownTextField(e) {
	var keyCode = e.keyCode
	if (isButtonEnabled(START_BUTTON)) {
		var txt = String.fromCharCode(e.which)

		if (keyCode == Key.ENTER) {
			if (!/^([A-Za-z0-9]{3,20})$/.test(getInput(USERNAME_INPUT))) {} else if (joinGame && withFriends && !/^([A-Za-z0-9]{6})$/.test(getInput(ID_INPUT))) {

			} else if (updateStartButton()) {
				sendForm()
				e.preventDefault()
				return false
			} else {
				e.preventDefault()
				return false
			}
		} else if (!/^([A-Za-z0-9])$/.test(txt)) {
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

function failSendForm(message) {
	setText(MESSAGE_TEXT, message)
	setVisible(MESSAGE_TEXT)
	if (formSent) {
		serverFail = true
		formSent = false
	} else {
		serverFail = false
	}
}

function sendForm() {
	setText(MESSAGE_TEXT, 'Joining game...')
	setVisible(MESSAGE_TEXT)

	let sendID = joinGame && withFriends

	var formPacket = {
		type: Pack.FORM_SEND,
		host: createGame,
		user: getInput(USERNAME_INPUT),
		id: sendID ? getInput(ID_INPUT) : '',
		players: players
	}

	socket.ws.send(JSON.stringify(formPacket))

	formSent = true
}

function hideMenu() {
	for (i in ALL_ELEMS) {
		//console.log("Hiding " + ALL_ELEMS[i])
		setHidden(ALL_ELEMS[i])
	}
}

// Thanks to https://css-tricks.com/scaled-proportional-blocks-with-css-and-javascript/
// https://codepen.io/chriscoyier/pen/VvRoWy
function doGuiResize() {
	const guiX = 500
	const guiY = 500
	const scaleX = window.innerWidth / guiX
	const scaleY = window.innerHeight / guiY

	var scale
	// viewport is too tall so limit by width
	if (scaleX < scaleY) {
		scale = scaleX

	} else { // limit by height
		scale = scaleY
	}

	document.getElementById(INPUT_DIV).style.transform = 'translate(-50%, -50%) ' + 'scale(' + scale + ')'
	document.getElementById(PING).style.transform = 'scale(' + scale + ')'
}

function hoverButton(elem) {
	elem.style.background = "rgba(200, 200, 200, 0.5)"
}

function unhoverButton(elem) {
	elem.style.background = "rgba(0, 0, 0, 0)"
}

function menuInit() {
	// Adds the hover behaviours to all buttons
	for (i in ALL_ELEMS) {
		var elem = document.getElementById(ALL_ELEMS[i])
		if (elem.classList.contains('btn')) {
			
			if (mobile) {
				// Small hack, shows hover colour then unhovers when the user clicks
				elem.addEventListener('mousedown', function(e)
				{
					hoverButton(e.target)
					setTimeout(function() {
						unhoverButton(e.target)
					}, 100)
				}, false);
			} else {
				// Usual hover behaviour for mouse
				elem.addEventListener('mouseover', function(e) {
					hoverButton(e.target)
				}, false);
				elem.addEventListener('mouseleave', function(e) {
					unhoverButton(e.target)
				}, false);
			}
		}
	}
}
