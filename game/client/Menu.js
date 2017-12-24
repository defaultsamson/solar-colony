var connectionAttempts = -1
var connected = false

function connect() {

    connectionText.visible = true

    var ws = socket.connect()

    ws.onerror = function (evt) {
        console.log('The WebSocket experienced an error')
    }

    ws.onclose = function (evt) {
        console.log('The WebSocket was closed [' + evt.code + '] (' + evt.reason + ')')

        //removeGameFeatures()
        connectionAttempts++
        connected = false

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

var usernameSelected = false
var flashingInput = 0

function gotoTitle() {
    hud.hideAll()

    joinGameText.visible = true
    joinGameText.box.visible = false
    createGameText.visible = true
    createGameText.box.visible = false

    joinRandomGameText.visible = true
    joinRandomGameText.box.visible = false
    joinRandomGameText.setEnabled(false)
    joinFriendsGameText.visible = true
    joinFriendsGameText.box.visible = false
    joinFriendsGameText.setEnabled(false)

    usernameEntry.visible = true

    document.getElementById('nameInput').style.visibility = 'visible'
    document.getElementById('idInput').style.visibility = 'hidden'

    goText.visible = true
    updateStartButton()
}

var nameGotGood = false
var idGotGood = false

function updateStartButton() {
    document.getElementById('nameCheck').style.visibility = 'hidden'
    document.getElementById('nameCross').style.visibility = 'hidden'
    document.getElementById('idCheck').style.visibility = 'hidden'
    document.getElementById('idCross').style.visibility = 'hidden'

    let nameCheck = /^([A-Za-z0-9]{3,20})$/.test(document.getElementById('nameInput').value)
    if (nameCheck) {
        document.getElementById('nameCheck').style.visibility = 'visible'
        nameGotGood = true
    } else if (nameGotGood) {
        document.getElementById('nameCross').style.visibility = 'visible'
    }

    let idRequired = joinGameText.box.visible && joinFriendsGameText.box.visible

    let idCheck = /^([A-Za-z0-9]{6})$/.test(document.getElementById('idInput').value)
    if (idRequired) {
        if (idCheck) {
            document.getElementById('idCheck').style.visibility = 'visible'
            idGotGood = true
        } else if (idGotGood) {
            document.getElementById('idCross').style.visibility = 'visible'
        }
    }

    // If the Join/Create game and Random/Friend buttons have been selected
    if ((joinGameText.box.visible || createGameText.box.visible) && (joinRandomGameText.box.visible || joinFriendsGameText.box.visible)) {
        if (nameCheck) {
            if (!idRequired || idCheck) {
                if (connected) {
                    goText.setEnabled()
                    return true
                }
            }
        }
    }
    goText.setEnabled(false)
    return false
}

document.onkeypress = function keyDownTextField(e) {
    if (goText.visible) {
        var keyCode = e.keyCode

        var txt = String.fromCharCode(e.which)

        if (keyCode == Key.ENTER) {
            if (updateStartButton()) {
                sendForm()
            }
            return false
        } else if (!/^([A-Za-z0-9])$/.test(txt)) {
            if (keyCode == Key.BACKSPACE || keyCode == Key.DELETE || keyCode == Key.TAB || keyCode == Key.ESCAPE || keyCode == Key.ENTER || keyCode == Key.CTRL || keyCode == Key.SHIFT || keyCode == Key.CMD || keyCode == Key.ALT || keyCode == Key.F1 || keyCode == Key.F2 || keyCode == Key.F3 || keyCode == Key.F4 || keyCode == Key.F5 || keyCode == Key.F6 || keyCode == Key.F7 || keyCode == Key.F8 || keyCode == Key.F9 || keyCode == Key.F10 || keyCode == Key.F11 || keyCode == Key.F12) {

            } else {
                // console.log(txt + ' : ' + e.which)
                e.preventDefault()
                return false
            }
        }
    }
}

function failSendForm(message) {
    sendingFormText.text = message
    sendingFormText.visible = true
}

function sendForm() {
    sendingFormText.text = 'Please wait while you are connected...'
    sendingFormText.visible = true

    let isHost = createGameText.box.visible
    let doID = joinFriendsGameText.box.visible && !isHost

    var formPacket = {
        type: 'form',
        host: isHost,
        user: document.getElementById('nameInput').value,
        id: doID ? document.getElementById('idInput').value : ''
    }

    socket.ws.send(JSON.stringify(formPacket))
}

var sendingForm = false

function menuSpaghetti(point) {
    function showJoinGame() {
        var withFriends = isSelected(joinFriendsGameText)
        var withRandom = isSelected(joinRandomGameText)

        gotoTitle()

        joinGameText.box.visible = true
        createGameText.box.visible = false
        joinFriendsGameText.setEnabled(true)
        joinFriendsGameText.box.visible = withFriends
        joinRandomGameText.setEnabled(true)
        joinRandomGameText.box.visible = withRandom

        idEntry.visible = withFriends
        document.getElementById('idInput').style.visibility = withFriends ? 'visible' : 'hidden'

    }

    function isSelected(button) {
        return button.box.visible
    }

    if (joinGameText.clicked(point)) {
        showJoinGame()

    } else if (createGameText.clicked(point)) {
        gotoTitle()
        joinGameText.box.visible = false
        createGameText.box.visible = true
        joinFriendsGameText.setEnabled(true)
        joinFriendsGameText.box.visible = true
    } else if (joinRandomGameText.clicked(point)) {
        joinFriendsGameText.box.visible = false
        joinRandomGameText.box.visible = true
        showJoinGame()
    } else if (isSelected(joinGameText) && joinFriendsGameText.clicked(point)) {
        joinFriendsGameText.box.visible = true
        joinRandomGameText.box.visible = false
        showJoinGame()
    }

    updateStartButton()

    if (goText.clicked(point)) {
        sendForm()
    }
}
