class Menu extends Object {
  constructor () {
    super()

    this.inTeamSelection = false

    this.lastPixels = -1
    this.lastShips = -1
    this.lastFocus = true

    this.formSent = false

    this.joinGame = false
    this.createGame = false

    this.randomGame = false
    this.withFriends = false

    this.username = ''
    this.gameID = ''
    this.players = 4

    let me = this

    function hoverButton (elem) {
      elem.style.background = 'rgba(200, 200, 200, 0.5)'
    }

    function unhoverButton (elem) {
      elem.style.background = 'rgba(0, 0, 0, 0)'
    }

    // Adds the hover behaviours to all buttons
    for (let i in Elem.Button) {
      let elem = document.getElementById(Elem.Button[i])
      elem.setAttribute('touch', false)

      // Usual hover behaviour for mouse.
      // the 'touch' attribute is a little bit hacky, it's used to detect
      // finger taps vs. mouse clicks. The difference is the button should
      // stop hovering at the end of a finger tap, but should continue
      // to hover at the end of a mouse click
      elem.addEventListener('mouseover', function (e) {
        if (e.target.getAttribute('touch') === 'false') {
          hoverButton(e.target)
        }
      }, false)
      elem.addEventListener('mouseleave', function (e) {
        unhoverButton(e.target)
        // e.target.setAttribute('touch', false)
      }, false)
      elem.addEventListener('touchstart', function (e) {
        if (e.target.getAttribute('enable_click') !== 'false') {
          hoverButton(e.target)
        }
      }, false)
      elem.addEventListener('touchend', function (e) {
        unhoverButton(e.target)
        e.target.setAttribute('touch', true)
        // Little bit of a hack to make sure the other events see the attribute
        setTimeout(function () {
          e.target.setAttribute('touch', false)
        }, 10)
      }, false)
      elem.addEventListener('mousedown', function (e) {
        if (e.target.getAttribute('enable_click') !== 'false') {
          hoverButton(e.target)
          // if it was a touch tap, unhover it after 50ms
          if (e.target.getAttribute('touch') === 'true') {
            setTimeout(function () {
              unhoverButton(e.target)
            }, 50)
          }
        }
      }, false)
    }

    document.getElementById(Elem.Button.JOIN).onmousedown = function () {
      me.joinGame = true
      me.reateGame = false
      me.updateGuiClick()
    }

    document.getElementById(Elem.Button.CREATE).onmousedown = function () {
      me.joinGame = false
      me.createGame = true
      me.updateGuiClick()
    }

    document.getElementById(Elem.Button.RANDOM).onmousedown = function () {
      if (me.joinGame) {
        me.randomGame = true
        me.withFriends = false
        me.updateGuiClick()
      }
    }

    document.getElementById(Elem.Button.WITH_FRIENDS).onmousedown = function () {
      if (me.joinGame || me.createGame) {
        me.randomGame = false
        me.withFriends = true
        me.updateGuiClick()
      }
    }

    function playerCount (p) {
      console.log('playerCounr: ' + p)
      me.players = p
      me.updateGuiClick()
    }

    document.getElementById(Elem.Button.PLAYERS_2).onmousedown = () => playerCount(2)
    document.getElementById(Elem.Button.PLAYERS_3).onmousedown = () => playerCount(3)
    document.getElementById(Elem.Button.PLAYERS_4).onmousedown = () => playerCount(4)
    document.getElementById(Elem.Button.PLAYERS_8).onmousedown = () => playerCount(8)
    document.getElementById(Elem.Button.PLAYERS_16).onmousedown = () => playerCount(16)
    document.getElementById(Elem.Button.ANY_PLAYERS).onmousedown = () => playerCount(-1)

    function joinTeam (i) {
      let pack = {
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

    document.getElementById(Elem.Button.START).onmousedown = function () {
      if (me.inTeamSelection) {
        let pack = {
          type: Pack.START_BUTTON
        }
        socket.send(pack)
        // disableButton(Elem.Button.START)
      } else {
        if (me.updateStartButton()) { me.sendForm() }
      }
    }

    document.getElementById(Elem.Button.QUIT).onmousedown = function () {
      me.gotoTitle()
      let pack = {
        type: Pack.QUIT
      }
      socket.send(pack)
    }

    document.getElementById(Elem.Button.BUY_SPAWN).onmousedown = function () {
      if (exists(focusPlanet)) { focusPlanet.createSpawnClick() }
    }

    function buyShips (num, price) {
      if (exists(focusPlanet)) { focusPlanet.createShipsClick(num, price) }
    }

    document.getElementById(Elem.Button.BUY_SHIPS_1000).onmousedown = () => buyShips(1000, 800)
    document.getElementById(Elem.Button.BUY_SHIPS_100).onmousedown = () => buyShips(100, 90)
    document.getElementById(Elem.Button.BUY_SHIPS_10).onmousedown = () => buyShips(10, 10)

    document.getElementById(Elem.Input.USERNAME).onkeyup = () => { me.updateStartButton() }
    document.getElementById(Elem.Input.ID).onkeyup = () => { me.updateStartButton() }

    document.onkeypress = function (e) {
      let keyCode = e.keyCode
      if (keyCode === Key.ENTER) {
        if (me.updateStartButton()) {
          me.sendForm()
        }
        e.preventDefault()
        return false
      }
    }

    document.onkeydown = function (e) {
      let keyCode = e.keyCode
      if (game && (keyCode === Key.ESCAPE || keyCode === Key.SPACE)) {
        game.onEscape()
      }
    }

    this.hide()
    setVisible(INPUT_DIV)
    setVisible(TOP_DIV)
  }

  gotoTitle () {
    this.inTeamSelection = false

    if (game) {
      game.removeSystem()
      game = null
    }

    this.formSent = false

    this.hide()
    setVisible(Elem.Text.CONNECTION_MESSAGE, !socket.connected)

    this.updateGuiClick()
  }

  updateGuiClick () {
    // Decides whether to stop showing the gui or continue
    let showRest = true

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

  updateStartButton () {
    if (this.formSent) {
      disableButton(Elem.Button.START)
      return false
    } else if (this.randomGame || this.withFriends) {
      setHidden(Elem.Image.USERNAME_CHECK)
      setHidden(Elem.Image.USERNAME_CROSS)
      setHidden(Elem.Image.ID_CHECK)
      setHidden(Elem.Image.ID_CROSS)

      let nameCheck = USERNAME_REGEX.test(getInput(Elem.Input.USERNAME))
      setVisible(Elem.Image.USERNAME_CHECK, nameCheck)
      setVisible(Elem.Image.USERNAME_CROSS, !nameCheck)

      let idRequired = this.joinGame && this.withFriends
      let idCheck
      if (idRequired) {
        idCheck = ID_REGEX.test(getInput(Elem.Input.ID))
        setVisible(Elem.Image.ID_CHECK, idCheck)
        setVisible(Elem.Image.ID_CROSS, !idCheck)
      }

      setHidden(Elem.Text.MESSAGE)

      // If the Join/Create game and Random/Friend buttons have been selected

      if (nameCheck) {
        if (!idRequired || idCheck) {
          if (socket.connected) {
            enableButton(Elem.Button.START)
            return true
          }
        } else {
          this.failSendForm('Game ID must be 6 characters, letters and numbers only')
        }
      } else {
        this.failSendForm('Username must be 3-20 characters, letters and numbers only')
      }
      disableButton(Elem.Button.START)
      return false
    }
  }

  failSendForm (message) {
    setText(Elem.Text.MESSAGE, message)
    setVisible(Elem.Text.MESSAGE)
    this.formSent = false
  }

  sendForm () {
    setText(Elem.Text.MESSAGE, 'Joining game...')
    setVisible(Elem.Text.MESSAGE)

    let sendID = this.joinGame && this.withFriends

    let formPacket = {
      type: Pack.FORM_SEND,
      host: this.createGame,
      name: getInput(Elem.Input.USERNAME),
      gameID: sendID ? getInput(Elem.Input.ID) : '',
      players: this.players
    }

    socket.send(formPacket)

    this.formSent = true
  }

  hide () {
    this.inTeamSelection = false

    for (let i in Elem) {
      for (let j in Elem[i]) { setHidden(Elem[i][j]) }
    }
  }

  // Thanks to https://css-tricks.com/scaled-proportional-blocks-with-css-and-javascript/
  // https://codepen.io/chriscoyier/pen/VvRoWy
  resize () {
    const guiX = INPUT_WIDTH
    const guiY = INPUT_HEIGHT
    const scaleX = window.innerWidth / guiX
    const scaleY = window.innerHeight / guiY

    let scale
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

  updateIngameGui () {
    if (game.myTeam) {
      let focussed = exists(focusPlanet) && focusPlanet.isMyPlanet()

      if (game.myTeam.shipCount !== this.lastShips) {
        this.lastShips = game.myTeam.shipCount
        setText(Elem.Text.SHIPS, 'Ships: ' + game.myTeam.shipCount)
      }

      // TODO this can be done in parse() when the server sends new pixels
      if (game.myTeam.pixels !== this.lastPixels) {
        this.lastPixels = game.myTeam.pixels
        setText(Elem.Text.PIXELS, 'Pixels: ' + game.myTeam.pixels)

        this.updatePlanetGui(focussed, true, false)
      }

      if (focussed !== this.lastFocus) {
        this.lastFocus = focussed

        setVisible(Elem.Text.PLANET_TEXT, focussed)
        setVisible(Elem.Text.PLANET_SHIPS, focussed)
        this.lastPlanetShips = -1

        setVisible(Elem.Button.BUY_SPAWN, focussed)
        setVisible(Elem.Button.BUY_SHIPS_1000, focussed)
        setVisible(Elem.Button.BUY_SHIPS_100, focussed)
        setVisible(Elem.Button.BUY_SHIPS_10, focussed)
        this.updatePlanetGui(focussed, true, true)
      }

      if (focussed) {
        if (focusPlanet.shipCount !== this.lastPlanetShips) {
          this.lastPlanetShips = focusPlanet.shipCount
          setText(Elem.Text.PLANET_SHIPS, 'Ships: ' + focusPlanet.shipCount)
          this.updatePlanetGui(focussed, false, true)
        }
      }
    }
  }

  updatePlanetGui (focussed, pixelUpdate, shipsUpdate) {
    if (pixelUpdate) {
      enableButton(Elem.Button.BUY_SHIPS_1000, game.myTeam.pixels >= 800)
      enableButton(Elem.Button.BUY_SHIPS_100, game.myTeam.pixels >= 90)
      enableButton(Elem.Button.BUY_SHIPS_10, game.myTeam.pixels >= 10)

      if (focussed && focusPlanet.spawnCount() >= MAX_SPAWNS) {
        setText(Elem.Button.BUY_SPAWN, 'MAX SPAWNS')
        disableButton(Elem.Button.BUY_SPAWN)
      } else {
        setText(Elem.Button.BUY_SPAWN, '1 Spawn (200P)')
        enableButton(Elem.Button.BUY_SPAWN, game.myTeam.pixels >= 200)
      }
    }

    if (shipsUpdate) {
      // TODO send ships buttons
    }
  }

  gotoTeamSelection () {
    this.hide()
    this.inTeamSelection = true

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
  }

  gotoPauseMenu () {
    setHidden(Elem.Text.COUNTDOWN)
    setVisible(Elem.Text.ID_DISPLAY1)
    setVisible(Elem.Text.ID_DISPLAY2)
    setVisible(Elem.Text.PAUSE)
    setVisible(Elem.Text.PAUSE_MESSAGE)
    setText(Elem.Text.PAUSE_MESSAGE, 'A player has left and the game has paused')
  }
}
