class SocketManager extends Object {
  constructor () {
    super()

    this.ws = null
    this.ping = 200
    this.countDown = 0
    this.connectionAttempts = -1
    this.connected = false
  }

  connect (secure) {
    setVisible(Elem.Text.CONNECTION_MESSAGE)
    setText(Elem.Text.CONNECTION_MESSAGE, 'Connecting to Server')

    let ip
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

    this.ws.onerror = function (evt) {
      console.log('The WebSocket experienced an error')
      console.log(evt)
    }

    this.ws.onclose = function (evt) {
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

    this.ws.onopen = function (evt) {
      console.log('The WebSocket was opened succesfully!')

      me.connectionAttempts = -1
      me.connected = true

      setText(Elem.Text.CONNECTION_MESSAGE, 'Setting up Session')
      menu.formSent = false

      // Start the session on the server
      let sessID = localStorage.getItem(SESSION_STORAGE)
      if (exists(sessID)) {
        me.send({
          type: Pack.SESSION,
          sessID: sessID
        })
      } else {
        me.send({
          type: Pack.SESSION
        })
      }

      // TODO menu.updateStartButton() when session is initialized
    }

    this.ws.onmessage = function (evt) {
      try {
        // console.log('The WebSocket was messaged [' + evt.origin + '] (' + evt.data + ')')
        let pack = JSON.parse(evt.data)
        me.parse(pack.type, pack)
      } catch (err) {
        console.log(err)
      }
    }
  }

  send (json) {
    this.ws.send(JSON.stringify(json))
  }

  parse (type, pack) {
    switch (type) {
      case Pack.PING_PROBE: {
        let pPack = {
          type: Pack.PING_PROBE
        }
        socket.send(pPack)
      }
        break
      case Pack.PING_SET: {
        this.ping = pack.ping
        setText(Elem.Text.PING, 'Ping: ' + this.ping + 'ms')
      }
        break
      case Pack.FORM_FAIL: {
        menu.failSendForm(pack.reason)
      }
        break
      case Pack.JOIN_GAME: {
        game = new ClientGame(pack.gameID, pack.maxPlayers)
        game.started = pack.started
        if (!pack.started) {
          menu.gotoTeamSelection()
        }
      }
        break
      case Pack.SESSION: {
        setHidden(Elem.Text.CONNECTION_MESSAGE)
        this.sessID = pack.sessID
        console.log('Session: ' + pack.sessID)
        localStorage.setItem(SESSION_STORAGE, pack.sessID)
      }
        break
      case Pack.UPDATE_MESSAGE: {
        // TODO change this??
        if (!(game && game.system)) {
          enableButton(Elem.Button.START, pack.startEnabled)

          setVisible(Elem.Text.MESSAGE)
          setText(Elem.Text.MESSAGE, pack.message)

          setVisible(Elem.Text.PLAYER_COUNT)
          setText(Elem.Text.PLAYER_COUNT, 'Players: (' + pack.playerCount + '/' + pack.maxPlayers + ')')
        }

        // TODO put this in the UPDATE_TEAMS section??
        game.myTeam = game.getTeam(pack.team)
      }
        break
      default: {
        if (game) game.parse(type, pack)
      }
    }
  }
}
