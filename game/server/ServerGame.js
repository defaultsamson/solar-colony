const System = require('../shared/System.js')
const Team = require('../shared/Team.js')
const Timeskewer = require('./Timeskewer.js')
const Game = require('../shared/Game.js')

class ServerGame extends Game {
  constructor (gameID, maxPlayers, gm) {
    super(gameID, maxPlayers)

    this.ids = 0
    this.gm = gm
    this.players = []
    this.started = false

    this.redTeam = this.addTeam(new Team(Colour.RED, 0))
    this.orangeTeam = this.addTeam(new Team(Colour.ORANGE, 1))
    this.yellowTeam = this.addTeam(new Team(Colour.YELLOW, 2))
    this.greenTeam = this.addTeam(new Team(Colour.GREEN, 3))
    this.blueTeam = this.addTeam(new Team(Colour.BLUE, 4))
    this.purpleTeam = this.addTeam(new Team(Colour.PURPLE, 5))
  }

  update (delta) {
    super.update(delta)

    for (let i in this.players) {
      this.players[i].pinger.update(delta)
    }
  }

  pause () {
    super.pause()

    this.sendPlayers({
      type: Pack.PAUSE,
      time: this.time
    })
  }

  play () {
    // When starting the game, the number of current players is
    // now the new number of max players allowed
    this.maxPlayers = this.players.length
    this.started = true

    let maxPing = 0
    for (let i in this.players) maxPing = Math.max(maxPing, this.players[i].pinger.ping)

    // starting sync for clients
    this.sendPlayers({
      type: Pack.PLAY,
      maxPing: maxPing
    })

    // The countdown will start for the clients at the same time as this
    setTimeout(() => {
      console.log('Starting game: ' + this.gameID)
      super.play()
    }, COUNTDOWN_TIME + maxPing)
  }

  parse (sock, type, pack) {
    switch (type) {
      case Pack.CREATE_SHIPS: {
        this.system.getPlanetByID(pack.pl).createShips(pack.n, pack.c)
      }
        break
      case Pack.CREATE_SPAWN: { // create spawn
        this.system.getPlanetByID(pack.pl).createSpawn()
      }
        break
      case Pack.JOIN_TEAM: {
        // Reset the start status
        for (let i in this.players) {
          this.players[i].start = false
        }
        // Remove the players from their previous team
        if (exists(sock.team)) {
          sock.team.removePlayer(sock)
        }
        let team = this.getTeam(pack.team)
        team.addPlayer(sock)
        sock.sess.teamID = team.id
        this.updateTeams()
      }
        break
      case Pack.START_BUTTON: {
        // If the sender didn't start and the sender has a team
        if (!sock.start && sock.team) {
          sock.start = true
          let chosen = 0
          for (let i in this.players) {
            if (this.players[i].start) {
              chosen++
            }
          }

          // Start the game if there's more than two players and all players have chosen a team
          if (chosen >= MIN_PLAYERS && chosen === this.players.length) {
            this.start()
          } else {
            // Else tell the other players to choose
            this.updateSelectionMessages()
          }
        }
      }
        break
      case Pack.QUIT: {
        this.removePlayer(sock)
        sock.approved = false
        sock.sess.gameID = null
        sock.sess.teamID = null
      }
        break
    }
  }

  canAddPlayer () {
    return this.players.length < this.maxPlayers
  }

  createTeams (sock) {
    let socks = exists(sock) ? [sock] : this.players

    let pack = {
      type: Pack.CREATE_TEAMS
    }

    pack.teams = []

    for (let i in this.teams) {
      pack.teams.push({
        id: this.teams[i].id,
        colour: this.teams[i].colour
      })
    }

    for (let i in socks) {
      let mess = JSON.stringify(pack)
      socks[i].send(mess)
    }

    this.updateTeams(sock)
  }

  updateTeams (sock) {
    let socks = exists(sock) ? [sock] : this.players

    let pack = {
      type: Pack.UPDATE_TEAMS
    }

    pack.teams = []

    for (let i in this.teams) {
      // Creates new team object
      let team = {
        id: this.teams[i].id
      }
      team.players = []

      // Adds the player names to this team
      for (let j in this.teams[i].players) {
        team.players.push(this.teams[i].players[j].sess.name)
      }
      pack.teams.push(team)
    }

    for (let i in socks) {
      let mess = JSON.stringify(pack)
      socks[i].send(mess)
    }

    this.updateSelectionMessages(sock)
  }

  updateSelectionMessages (sock) {
    let socks = exists(sock) ? [sock] : this.players

    const total = this.players.length
    let started = 0
    for (let i in this.players) {
      if (this.players[i].start) {
        started++
      }
    }

    let pack = {
      type: Pack.UPDATE_MESSAGE,
      maxPlayers: this.maxPlayers,
      playerCount: this.players.length
    }

    // Customizes start text and button text
    for (let i in socks) {
      let team = socks[i].team
      pack.startEnabled = false
      pack.team = -1
      if (team) {
        pack.team = team.id
        if (total < MIN_PLAYERS) {
          let need = MIN_PLAYERS - total
          pack.message = need + ' more player' + (need !== 1 ? 's' : '') + ' required to start game...'
        } else if (this.players[i].start) {
          if (total === started) {
            // Double checks to make sure that more than one team is populated populated
            let populatedTeams = 0
            for (let i in this.teams) {
              if (this.teams[i].players.length > 0) {
                populatedTeams++
              }
            }
            if (populatedTeams < 2) {
              pack.message = 'More than one team must be populated'
            }
          } else {
            let starting = total - started
            pack.message = 'Waiting for ' + starting + ' player' + (starting !== 1 ? 's' : '') + ' to confirm teams (' + started + '/' + total + ')'
          }
        } else {
          pack.message = 'Press start to begin with these teams'
          pack.startEnabled = true
        }
      } else {
        pack.message = 'Click a colour to choose a team'
      }

      socks[i].send(JSON.stringify(pack))
    }
  }

  addPlayer (sock) {
    sock.sess.gameID = this.gameID
    sock.game = this
    sock.approved = true
    sock.pinger = new Timeskewer(sock)
    this.players.push(sock)

    let packet = {
      type: Pack.JOIN_GAME,
      gameID: this.gameID,
      maxPlayers: this.maxPlayers
    }
    sock.send(JSON.stringify(packet))

    this.createTeams(sock)

    if (exists(sock.sess.teamID)) {
      let team = this.getTeam(sock.sess.teamID)
      if (team) {
        team.addPlayer(sock)
        this.updateTeams()
      }
    }

    if (this.started) {
      // TODO send the system and resume the game
    } else {
      this.updateSelectionMessages()
    }
  }

  removePlayer (sock) {
    if (sock.team) {
      sock.team.removePlayer(sock)
    }

    // Removes the player from the list of players
    let i = this.players.indexOf(sock)
    if (i !== -1) {
      this.players.splice(i, 1)
    }

    // If there's still players left in the game
    if (this.players.length > 0) {
      if (!this.paused) {
        this.pause()
      } else if (!this.started) {
        this.updateTeams()
      }
    } else {
      this.gm.removeGame(this)
    }
  }

  start () {
    console.log('Starting Game: ' + this.gameID)

    this.gm.removeQueue(this)

    this.rebuildTeams()

    let sys = {
      'orbits': [{
        'x': 0,
        'y': 0,
        'radius': 150,
        'planets': [{
          'radius': 13,
          'rotationConstant': -1 / 4,
          'startAngle': Math.PI / 2,
          'opm': 2
        }]
      }, {
        'x': 0,
        'y': 0,
        'radius': 220,
        'planets': [{
          'radius': 13,
          'rotationConstant': -1 / 6,
          'startAngle': 0,
          'opm': 1
        }, {
          'radius': 13,
          'rotationConstant': -1 / 6,
          'startAngle': Math.PI,
          'opm': 1
        }]
      }, {
        'x': 0,
        'y': 0,
        'radius': 270,
        'planets': [{
          'radius': 13,
          'rotationConstant': 1 / 3,
          'startAngle': Math.PI / 4,
          'opm': 1 / 2
        }]
      }, {
        'x': 0,
        'y': 0,
        'radius': 360,
        'planets': [{
          'radius': 13,
          'rotationConstant': -1 / 2,
          'startAngle': 3 * Math.PI / 4,
          'opm': 1 / 4
        }]
      }]
    }

    this.system = new System(this)

    const orbit1 = this.system.addOrbit(new Orbit(0, 0, 150))
    const orbit2 = this.system.addOrbit(new Orbit(0, 0, 220))
    const orbit3 = this.system.addOrbit(new Orbit(0, 0, 270))
    const orbit4 = this.system.addOrbit(new Orbit(0, 0, 360))

    const planet1 = orbit1.addPlanet(new Planet(12, -1 / 4, Math.PI / 2, 2))

    // builds the player planets
    const planetCount = this.teams.length
    const rotation = 2 * Math.PI / planetCount
    for (let i = 0; i < planetCount; i++) {
      let planet = orbit2.addPlanet(new Planet(12, -1 / 6, rotation * i, 1))

      planet.setTeam(this.teams[i])
      planet.createSpawn(true)
    }

    const planet3 = orbit3.addPlanet(new Planet(12, 1 / 3, Math.PI / 4, 1 / 2))
    const planet4 = orbit4.addPlanet(new Planet(12, -0.5, 3 * Math.PI / 4, 1 / 4))

    this.sendPlayers({
      type: Pack.CREATE_SYSTEM,
      sys: this.system.save(true)
    })

    // Start all teams off with an amount of pixels
    for (let i in this.teams) { this.teams[i].setPixels(STARTING_PIXELS) }

    this.play()

    // console.log(System.load(this.system.save(), this))
  }

  sendPlayers (obj) {
    let toSend = JSON.stringify(obj)
    for (let i in this.players) {
      this.players[i].send(toSend)
    }
  }

  createID () {
    return this.ids++
  }
}

module.exports = ServerGame
