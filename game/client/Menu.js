// To be completely honest, most of this code is spaghetti, but the menu works sooo... :/

var connectionAttempts = -1
var connected = false

function isSelectedOld(button) {
    return button.box.visible
}

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

    updateGuiClick()

    goText.visible = true
    updateStartButton()

    formSent = false
}

var nameGotGood = false
var idGotGood = false

var joinGame = false
var createGame = false

var randomGame = false
var withFriends = false

var username = ''
var gameID = ''
var players = 2

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

        if (isSelected('withFriends')) {
            setVisible('idText')
            setVisible('idInput')
        } else {
            setHidden('idText')
            setHidden('idInput')
        }
    } else {
        setHidden('userText')
        setHidden('nameInput')
        setHidden('idText')
        setHidden('idInput')
    }

    playerCount.visible = true
    let playerCounts = [playerCount2, playerCount3, playerCount4, playerCount5, playerCount8, playerCount10, playerCountAny]

    for (var i in playerCounts) {
        playerCounts[i].visible = true
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

function updateStartButton() {
    setHidden('nameCheck')
    setHidden('nameCross')
    setHidden('idCheck')
    setHidden('idCross')

    if (formSent) {
        goText.setEnabled(false)
        return false
    } else {
        let nameCheck = /^([A-Za-z0-9]{3,20})$/.test(document.getElementById('nameInput').value)
        if (nameCheck) {
            setVisible('nameCheck')
            nameGotGood = true
        } else if (nameGotGood) {
            setVisible('nameCross')
        }

        let idRequired = isSelectedOld(joinGameText) && isSelectedOld(joinFriendsGameText)

        let idCheck = /^([A-Za-z0-9]{6})$/.test(document.getElementById('idInput').value)
        if (idRequired) {
            if (idCheck) {
                setVisible('idCheck')
                idGotGood = true
            } else if (idGotGood) {
                setVisible('idCross')
            }
        }

        var playerCountRequired = isSelectedOld(joinGameText) && isSelectedOld(joinRandomGameText)
        var playerCountCheck = false
        if (playerCountRequired) {
            let playerCounts = [playerCount2, playerCount3, playerCount4, playerCount5, playerCount8, playerCount10, playerCountAny]
            for (var i in playerCounts) {
                if (isSelectedOld(playerCounts[i])) {
                    playerCountCheck = true
                    break
                }
            }
        }

        if (!serverFail) {
            sendingFormText.visible = false
        }

        // If the Join/Create game and Random/Friend buttons have been selected
        if (isSelectedOld(joinGameText) || isSelectedOld(createGameText) && (isSelectedOld(joinRandomGameText) || isSelectedOld(joinFriendsGameText))) {
            if (nameCheck) {
                if (!idRequired || idCheck) {
                    if (!playerCountRequired || playerCountCheck) {
                        if (connected) {
                            goText.setEnabled()
                            return true
                        }
                    } else {
                        failSendForm('Please choose a player count')
                    }
                } else if (idGotGood) {
                    failSendForm('Game ID must be 6 characters, letters and numbers only')
                }
            } else if (nameGotGood) {
                failSendForm('Username must be 3-20 characters, letters and numbers only')
            }
        }
        goText.setEnabled(false)
        return false
    }
}


document.onkeypress = function keyDownTextField(e) {
    var keyCode = e.keyCode
    if (goText.visible) {
        var txt = String.fromCharCode(e.which)

        if (keyCode == Key.ENTER) {
            if (!/^([A-Za-z0-9]{3,20})$/.test(document.getElementById('nameInput').value)) {} else if (isSelectedOld(joinGameText) && isSelectedOld(joinFriendsGameText) && !/^([A-Za-z0-9]{6})$/.test(document.getElementById('idInput').value)) {} else if (updateStartButton()) {
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

var serverFail = false
var formSent = false

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

    let isHost = isSelectedOld(createGameText)
    let doID = isSelectedOld(joinFriendsGameText) && !isHost

    var players
    if (isSelectedOld(playerCount2)) {
        players = 2
    } else if (isSelectedOld(playerCount3)) {
        players = 3
    } else if (isSelectedOld(playerCount4)) {
        players = 4
    } else if (isSelectedOld(playerCount5)) {
        players = 5
    } else if (isSelectedOld(playerCount8)) {
        players = 8
    } else if (isSelectedOld(playerCount10)) {
        players = 10
    } else {
        players = -1 // denotes "any"
    }

    var formPacket = {
        type: Pack.FORM_SEND,
        host: isHost,
        user: document.getElementById('nameInput').value,
        id: doID ? document.getElementById('idInput').value : '',
        players: players
    }

    socket.ws.send(JSON.stringify(formPacket))

    formSent = true
}

function menuSpaghetti(point) {
    let playerCounts = [playerCount2, playerCount3, playerCount4, playerCount5, playerCount8, playerCount10, playerCountAny]

    function resetPlayerCounts() {
        for (var i in playerCounts) {
            playerCounts[i].box.visible = false
        }
    }

    function showJoinGame() {
        var withFriends = isSelectedOld(joinFriendsGameText)
        var withRandom = isSelectedOld(joinRandomGameText)

        gotoTitle()

        joinGameText.box.visible = true
        createGameText.box.visible = false
        joinFriendsGameText.setEnabled(true)
        joinFriendsGameText.box.visible = withFriends
        joinRandomGameText.setEnabled(true)
        joinRandomGameText.box.visible = withRandom

        idEntry.visible = withFriends
        playerCount.visible = withRandom
        for (var i in playerCounts) {
            playerCounts[i].visible = withRandom
        }
        document.getElementById('idInput').style.visibility = withFriends ? 'visible' : 'hidden'
    }

    if (false) {
        joinGameClicked = false
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
    } else if (joinFriendsGameText.clicked(point)) {
        joinFriendsGameText.box.visible = true
        joinRandomGameText.box.visible = false
        showJoinGame()
    } else if (playerCount2.clicked(point)) {
        resetPlayerCounts()
        playerCount2.box.visible = true
    } else if (playerCount3.clicked(point)) {
        resetPlayerCounts()
        playerCount3.box.visible = true
    } else if (playerCount4.clicked(point)) {
        resetPlayerCounts()
        playerCount4.box.visible = true
    } else if (playerCount5.clicked(point)) {
        resetPlayerCounts()
        playerCount5.box.visible = true
    } else if (playerCount8.clicked(point)) {
        resetPlayerCounts()
        playerCount8.box.visible = true
    } else if (playerCount10.clicked(point)) {
        resetPlayerCounts()
        playerCount10.box.visible = true
    } else if (playerCountAny.clicked(point)) {
        resetPlayerCounts()
        playerCountAny.box.visible = true
    }

    updateStartButton()

    if (goText.clicked(point)) {
        sendForm()
    }
}
