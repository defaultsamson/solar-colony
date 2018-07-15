// To be completely honest, most of this code is spaghetti, but the menu works sooo... :/

var connectionAttempts = -1
var connected = false

function connect() {

	setVisible(Elem.Text.CONNECTION_MESSAGE)

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
		setHidden(Elem.Text.CONNECTION_MESSAGE)
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
	setVisible(Elem.Text.CONNECTION_MESSAGE, !connected)

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

	setVisible(Elem.Button.JOIN)
	setVisible(Elem.Button.CREATE)

	enableButton(Elem.Button.RANDOM)
	if (joinGame) {
		selectButton(Elem.Button.JOIN)
		deselectButton(Elem.Button.CREATE)
	} else if (createGame) {
		deselectButton(Elem.Button.JOIN)
		selectButton(Elem.Button.CREATE)

		randomGame = false
		withFriends = true
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

	if (randomGame) {
		selectButton(Elem.Button.RANDOM)
		deselectButton(Elem.Button.WITH_FRIENDS)
	} else if (withFriends) {
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

		setVisible(Elem.Text.ID, joinGame && withFriends)
		setVisible(Elem.Input.ID, joinGame && withFriends)

		setVisible(Elem.Text.PLAYERS, randomGame)
		setVisible(Elem.Button.PLAYERS_2, randomGame)
		setVisible(Elem.Button.PLAYERS_3, randomGame)
		setVisible(Elem.Button.PLAYERS_4, randomGame)
		setVisible(Elem.Button.PLAYERS_8, randomGame)
		setVisible(Elem.Button.PLAYERS_16, randomGame)
		setVisible(Elem.Button.ANY_PLAYERS, randomGame)

		if (randomGame) {
			deselectButton(Elem.Button.PLAYERS_2)
			deselectButton(Elem.Button.PLAYERS_3)
			deselectButton(Elem.Button.PLAYERS_4)
			deselectButton(Elem.Button.PLAYERS_8)
			deselectButton(Elem.Button.PLAYERS_16)
			deselectButton(Elem.Button.ANY_PLAYERS)

			switch (players) {
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
		updateStartButton()

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
			type: Pack.START_BUTTON
		}
		socket.ws.send(JSON.stringify(pack))
		//disableButton(Elem.Button.START)
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
		disableButton(Elem.Button.START)
		return false
	} else if (randomGame || withFriends) {
		setHidden(Elem.Image.USERNAME_CHECK)
		setHidden(Elem.Image.USERNAME_CROSS)
		setHidden(Elem.Image.ID_CHECK)
		setHidden(Elem.Image.ID_CROSS)

		let nameCheck = /^([A-Za-z0-9]{3,20})$/.test(getInput(Elem.Input.USERNAME))
		if (nameCheck) {
			setVisible(Elem.Image.USERNAME_CHECK)
			nameGotGood = true
		} else if (nameGotGood) {
			setVisible(Elem.Image.USERNAME_CROSS)
		}

		let idRequired = joinGame && withFriends
		let idCheck
		if (idRequired) {
			idCheck = /^([A-Za-z0-9]{6})$/.test(getInput(Elem.Input.ID))
			if (idCheck) {
				setVisible(Elem.Image.ID_CHECK)
				idGotGood = true
			} else if (idGotGood) {
				setVisible(Elem.Image.ID_CROSS)
			}
		}

		// TODO remove this? double check where it's used
		if (!serverFail) {
			setHidden(Elem.Text.MESSAGE)
		}

		// If the Join/Create game and Random/Friend buttons have been selected

		if (nameCheck) {
			if (!idRequired || idCheck) {
				if (connected) {
					enableButton(Elem.Button.START)
					return true
				}
			} else if (idGotGood) {
				failSendForm('Game ID must be 6 characters, letters and numbers only')
			}
		} else if (nameGotGood) {
			failSendForm('Username must be 3-20 characters, letters and numbers only')
		}
		disableButton(Elem.Button.START)
		return false
	}
}

document.onkeypress = function keyDownTextField(e) {
	var keyCode = e.keyCode
	if (isButtonEnabled(Elem.Button.START)) {
		var txt = String.fromCharCode(e.which)

		if (keyCode == Key.ENTER) {
			if (!/^([A-Za-z0-9]{3,20})$/.test(getInput(Elem.Input.USERNAME))) {} else if (joinGame && withFriends && !/^([A-Za-z0-9]{6})$/.test(getInput(Elem.Input.ID))) {

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
	setText(Elem.Text.MESSAGE, message)
	setVisible(Elem.Text.MESSAGE)
	if (formSent) {
		serverFail = true
		formSent = false
	} else {
		serverFail = false
	}
}

function sendForm() {
	setText(Elem.Text.MESSAGE, 'Joining game...')
	setVisible(Elem.Text.MESSAGE)

	let sendID = joinGame && withFriends

	var formPacket = {
		type: Pack.FORM_SEND,
		host: createGame,
		user: getInput(Elem.Input.USERNAME),
		id: sendID ? getInput(Elem.Input.ID) : '',
		players: players
	}

	socket.ws.send(JSON.stringify(formPacket))

	formSent = true
}

function hideMenu() {
	for (i in Elem.Button) {
		setHidden(Elem.Button[i])
	}
	for (i in Elem.Text) {
		setHidden(Elem.Text[i])
	}
	for (i in Elem.List) {
		setHidden(Elem.List[i])
	}
	for (i in Elem.Input) {
		setHidden(Elem.Input[i])
	}
	for (i in Elem.Image) {
		setHidden(Elem.Image[i])
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

	// Scale the desktop version to be smaller
	if (!mobile) {
		scale *= 0.75
	}
	scale = Math.max(scale, 0.5)

	document.getElementById(INPUT_DIV).style.transform = 'translate(-50%, -50%) ' + 'scale(' + scale + ')'
	document.getElementById(TOP_DIV).style.transform = 'scale(' + scale + ')'
}

function hoverButton(elem) {
	elem.style.background = 'rgba(200, 200, 200, 0.5)'
}

function unhoverButton(elem) {
	elem.style.background = 'rgba(0, 0, 0, 0)'
}

function menuInit() {
	// Adds the hover behaviours to all buttons
	for (i in Elem.Button) {
		var elem = document.getElementById(Elem.Button[i])
		//if (elem.classList.contains('btn')) {
			
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
		//}
	}
}
