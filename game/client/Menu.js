// To be completely honest, most of this code is spaghetti, but the menu works sooo... :/

var connectionAttempts = -1
var connected = false

function connect() {

    connectionText.visible = true

    var ws = socket.connect()

    ws.onerror = function (evt) {
        console.log('The WebSocket experienced an error')
        console.log(evt.err)
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

        connectionText.visible = true
        couldntReachText.visible = true
        couldntReachText.text = 'Couldn\'t establish connection, retrying... [' + connectionAttempts + ']'

        connect()
    }

    ws.onopen = function (evt) {
        console.log('The WebSocket was opened succesfully!')

        connectionAttempts = -1
        connected = true
        connectionText.visible = false
        couldntReachText.visible = false
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
    var connecting = connectionText.visible
    var connectingError = couldntReachText.visible

    allowMouseClick = true

    if (system) {
        viewport.removeChild(system)
        system = null
    }

    hud.hideAll()
    connectionText.visible = connecting
    couldntReachText.visible = connectingError

    formSent = false
    shownStart = false

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

    enableButton('randomGame')
    if (joinGame) {
        selectButton('joinGame')
        deselectButton('createGame')
    } else if (createGame) {
        deselectButton('joinGame')
        selectButton('createGame')

        randomGame = false
        withFriends = true
        disableButton('randomGame')

    } else {
        deselectButton('createGame')
        deselectButton('joinGame')
        showRest = false
    }

    // Show the rest of the menu?
    if (showRest) {
        setVisible('randomGame')
        setVisible('withFriends')
    } else {
        setHidden('randomGame')
        setHidden('withFriends')
    }

    if (randomGame) {
        selectButton('randomGame')
        deselectButton('withFriends')
    } else if (withFriends) {
        deselectButton('randomGame')
        selectButton('withFriends')
    } else {
        deselectButton('randomGame')
        deselectButton('withFriends')
        showRest = false
    }

    // Show the rest of the menu?
    if (showRest) {
        setVisible('userText')
        setVisible('nameInput')

        setVisible('idText', joinGame && withFriends)
        setVisible('idInput', joinGame && withFriends)

        setVisible('playerCount', randomGame)
        setVisible('player2', randomGame)
        setVisible('player3', randomGame)
        setVisible('player4', randomGame)
        setVisible('player8', randomGame)
        setVisible('player16', randomGame)
        setVisible('playerRandom', randomGame)

        if (randomGame) {
            deselectButton('player2')
            deselectButton('player3')
            deselectButton('player4')
            deselectButton('player8')
            deselectButton('player16')
            deselectButton('playerRandom')

            switch (players) {
                default: selectButton('playerRandom')
                break
                case 2:
                        selectButton('player2')
                    break
                case 3:
                        selectButton('player3')
                    break
                case 4:
                        selectButton('player4')
                    break
                case 8:
                        selectButton('player8')
                    break
                case 16:
                        selectButton('player16')
                    break
            }
        }

        setVisible('startGame')
        updateStartButton()

    } else {
        setHidden('userText')
        setHidden('nameInput')
        setHidden('idText')
        setHidden('idInput')

        setHidden('playerCount')
        setHidden('player2')
        setHidden('player3')
        setHidden('player4')
        setHidden('player8')
        setHidden('player16')
        setHidden('playerRandom')

        setHidden('startGame')
    }
}

function joinGameButton() {
    joinGame = true
    createGame = false
    updateGuiClick()
}

function createGameButton() {
    joinGame = false
    createGame = true
    updateGuiClick()
}

function randomGameButton() {
    randomGame = true
    withFriends = false
    updateGuiClick()
}

function withFriendsButton() {
    randomGame = false
    withFriends = true
    updateGuiClick()
}

function playerCount(p) {
    players = p
    updateGuiClick()
}

function startButton() {

}

var nameGotGood = false
var idGotGood = false

function updateStartButton() {

    if (formSent) {
        disableButton('startGame')
        return false
    } else if (randomGame || withFriends) {
        setHidden('nameCheck')
        setHidden('nameCross')
        setHidden('idCheck')
        setHidden('idCross')

        let nameCheck = /^([A-Za-z0-9]{3,20})$/.test(getInput('nameInput'))
        console.log('nameCheck: ' + nameCheck)
        if (nameCheck) {
            setVisible('nameCheck')
            nameGotGood = true
        } else if (nameGotGood) {
            setVisible('nameCross')
        }

        let idRequired = joinGame && withFriends
        let idCheck
        if (idRequired) {
            idCheck = /^([A-Za-z0-9]{6})$/.test(getInput('idInput'))
            if (idCheck) {
                setVisible('idCheck')
                idGotGood = true
            } else if (idGotGood) {
                setVisible('idCross')
            }
        }

        // TODO remove this? double check where it's used
        if (!serverFail) {
            sendingFormText.visible = false
        }

        // If the Join/Create game and Random/Friend buttons have been selected

        if (nameCheck) {
            if (!idRequired || idCheck) {
                if (!connected) {
                    enableButton('startGame')
                    return true
                }
            } else if (idGotGood) {
                failSendForm('Game ID must be 6 characters, letters and numbers only')
            }
        } else if (nameGotGood) {
            failSendForm('Username must be 3-20 characters, letters and numbers only')
        }
        disableButton('startGame')
        return false
    }
}

document.onkeypress = function keyDownTextField(e) {
    var keyCode = e.keyCode
    if (goText.visible) {
        var txt = String.fromCharCode(e.which)

        if (keyCode == Key.ENTER) {
            if (!/^([A-Za-z0-9]{3,20})$/.test(getInput('nameInput'))) {} else if (joinGame && withFriends && !/^([A-Za-z0-9]{6})$/.test(getInput('idInput'))) {

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
    sendingFormText.text = message
    sendingFormText.visible = true
    if (formSent) {
        serverFail = true
        formSent = false
    } else {
        serverFail = false
    }
}

function sendForm() {
    sendingFormText.text = 'Please wait while you are connected...'
    sendingFormText.visible = true

    let sendID = joinGame && withFriends

    var formPacket = {
        type: Pack.FORM_SEND,
        host: createGame,
        user: getInput('nameInput'),
        id: sendID ? getInput('idInput') : '',
        players: players
    }

    socket.ws.send(JSON.stringify(formPacket))

    formSent = true
}

function menuSpaghetti(point) {

    updateStartButton()

    if (goText.clicked(point)) {
        sendForm()
    }
}
