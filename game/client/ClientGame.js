class ClientGame extends Game {
  constructor (gameID, maxPlayers) {
    super(gameID, maxPlayers)

    this.myTeam = null

    this.diff = 0
  }

  removeSystem () {
    viewport.removeChild(this.system)
    this.system = null
  }

  update (delta) {
    super.update(delta)
    menu.updateIngameGui()

    if (this.countdown) {
      let elapsed = this.targetTime - Date.now()
      setText(Elem.Text.COUNTDOWN, 'Starting Game in ' + Math.ceil(elapsed / 1000))

      if (elapsed <= 0) {
        setHidden(Elem.Text.COUNTDOWN)
        this.countdown = false
        this.play()
        this.update(-elapsed * 0.001)
      }
    }
  }

  onEscape () {
    if (isChoosingShipSend()) {
      cancelSendShips()
    } else {
      centerView()
    }
  }

  onMouseClick (e) {
    if (this.system) {
      if (isChoosingShipSend()) {
        // updateSelectedPlanet(e.world.x, e.world.y)

        if (selectedPlanet) {
          sendShipsFrom.sendShipsTo(selectedPlanet, sendShipsAmount)
        }
        cancelSendShips()

        return
      }

      /*
      if (sendShipText.clicked(point)) {
        goToSendShipsScreen(focusPlanet, 100)
        return
      }
      */

      let planet = this.system.getPlanet(e.world.x, e.world.y)
      if (planet) {
        // If the viewport is already following the planet that was clicked on, then don't do anything

        if (focusPlanet !== planet) {
          focusPlanet = planet

          // The calculated future positions of the planet
          let pos = planet.calcPosition(ANIMATION_TIME / 1000)

          // Snap to that position
          viewport.snap(pos.x, pos.y, {
            time: ANIMATION_TIME,
            removeOnComplete: true,
            ease: 'easeOutQuart'
          })

          // Do the zoom
          viewport.snapZoom({
            height: PLANET_HEIGHT,
            time: ANIMATION_TIME,
            removeOnComplete: true,
            ease: 'easeInOutSine'
          })
        }

        return
      }

      // If nothing was clicked on, remove the follow plugin
      stopViewport()
      centerView()
    }
  }

  parse (type, pack) {
    switch (type) {
      case Pack.PAUSE: {
        this.countdown = false

        // The difference from the server time to the current time
        this.diff = pack.time - this.time
        console.log('this: ' + this.time)
        console.log('pack: ' + pack.time)
        console.log('diff: ' + this.diff)

        if (this.diff < 0) {
          // Client is now ahead by diff
          // This happens when the server will pause,
          // then it will take the ping time for this
          // client to recieve the message
          this.diff = -this.diff
        } else if (this.diff > 0) {
          // Client is now behind by diff
          // Catch up!
          this.update(this.diff * 0.001)
          this.diff = 0
        }

        this.pause()

        menu.gotoPauseMenu()
      }
        break

      case Pack.PLAY: {
        this.countdown = true
        this.targetTime = Date.now() + COUNTDOWN_TIME + pack.maxPing + this.diff - socket.ping

        setVisible(Elem.Text.COUNTDOWN)

        setHidden(Elem.Text.ID_DISPLAY1)
        setHidden(Elem.Text.ID_DISPLAY2)
        setHidden(Elem.Text.PAUSE)
        setHidden(Elem.Text.PAUSE_MESSAGE)
      }
        break

      case Pack.CREATE_SPAWN: {
        let planet = this.system.getPlanetByID(pack.planet)

        if (pack.force) {
          planet.createSpawn(true)
        } else {
          // 1. subtract the counter that has happened while this packet sent
          // 2. update the spawn counter by creating a spawn
          // 3. push the spawn counter forward by the new rate
          planet.pixelCounter -= planet.pixelRate * socket.ping * 0.001
          planet.createSpawn(false)
          planet.pixelCounter += planet.pixelRate * socket.ping * 0.001
        }
      }
        break

      case Pack.SET_PLANET_TEAM: {
        // TODO make a way with the fighting system to check when a planet has captured
        // a planet without needing to use this SET_TEAM_PLANET packet
        let planet = this.system.getPlanetByID(pack.planet)
        let team = this.getTeam(pack.team)
        planet.setTeam(team)
      }
        break

      case Pack.UPDATE_PIXELS: { // update pixel count
        this.myTeam.setPixels(pack.pl)
      }
        break

      case Pack.CREATE_SHIPS: { // buy ships
        this.system.getPlanetByID(pack.pl).createShips(pack.n, pack.c)
      }
        break

      case Pack.CREATE_SYSTEM: {
        this.system = System.load(pack.sys, this)

        viewport.addChild(this.system)
        menu.hide()
        setVisible(Elem.Text.PING)
        setVisible(Elem.Text.PIXELS)
        setVisible(Elem.Text.SHIPS)

        // A little hack to get planets to go to their correct positions when the game starts
        this.play() // This lets us update the planets
        this.update(0) // this updates them from their default pos
        this.pause() // This reverts the game state to being paused

        setText(Elem.Text.COUNTDOWN, 'Starting Game soon...')
        setVisible(Elem.Text.COUNTDOWN)

        // TODO may not need to resume these?
        // they may not be paused
        viewport.resumePlugin('drag')
        viewport.resumePlugin('pinch')
        viewport.resumePlugin('wheel')
        viewport.moveCenter(0, 0)
      }
        break

      case Pack.CREATE_TEAMS: {
        this.teams = []
        for (let i in pack.teams) {
          let id = pack.teams[i].id
          let colour = pack.teams[i].colour
          this.teams.push(new Team(colour, id))
        }
      }
        break

      case Pack.UPDATE_TEAMS: {
        // Clear the GUI
        document.getElementById(Elem.List.TEAM_RED).innerHTML = ''
        document.getElementById(Elem.List.TEAM_ORANGE).innerHTML = ''
        document.getElementById(Elem.List.TEAM_YELLOW).innerHTML = ''
        document.getElementById(Elem.List.TEAM_GREEN).innerHTML = ''
        document.getElementById(Elem.List.TEAM_BLUE).innerHTML = ''
        document.getElementById(Elem.List.TEAM_PURPLE).innerHTML = ''

        for (let i in this.teams) {
          this.teams[i].players = []
        }

        for (let i in pack.teams) {
          // Team Object and teamID
          let team = pack.teams[i]
          let teamID = team.id
          let teamObj = this.getTeam(teamID)
          for (let j in team.players) {
            // player name
            let name = team.players[j]

            // Adds new player object to the team object
            teamObj.addPlayer(new Player(name))

            let list
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
            let entry = document.createElement('li')
            entry.appendChild(document.createTextNode(name))
            list.appendChild(entry)
          }
        }
      }
        break
    }
  }
}
