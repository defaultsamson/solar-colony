const Orbit = require('../shared/Orbit.js')
const Planet = require('../shared/Planet.js')
const System = require('../shared/System.js')
const Team = require('../shared/Team.js')

class Game extends Object {
    constructor(gameID) {
        super()

        this.gameID = gameID

        this.players = []

        this.system = null

        this.countdown = 0
        this.pingTest = 0
    }

    update(delta) {
        if (this.system) {
            this.system.update(delta)
        }
    }

    addPlayer(sock) {

        var player = 0

        // TODO up to 8 players?
        if (this.players.length == 0) {
            this.players[0] = sock
            player = 1
            this.createSystem()
        } else {
            this.players[1] = sock
            player = 2
        }

        var packet = {
            type: 'joingame',
            gameID: this.gameID,
            player: player
        }
        sock.send(JSON.stringify(packet))
    }

    start() {
        var pack = {
            type: 'startgame'
        }
        this.sendPlayers(pack)
    }

    sendPlayers(obj) {
        var toSend = JSON.stringify(obj)
        for (var i in this.players) {
            this.players[i].send(toSend)
        }
    }

    sendTeamByID(teamID, obj) {
        var toSend = JSON.stringify(obj)
        for (var i in this.players) {
            if (this.players[i].team.id == teamID) {
                this.players[i].send(toSend)
            }
        }
    }

    sendTeam(team, obj) {
        var toSend = JSON.stringify(obj)
        for (var i in this.players) {
            if (this.players[i].team === team) {
                this.players[i].send(toSend)
            }
        }
    }

    createSystem() {
        console.log('starting the system because I\'m Gay')

        this.system = new System()
        this.system.game = this

        // Creates the system on the client-side
        var pack = {
            type: 'createsystem'
        }
        this.sendPlayers(pack)

        const orbit1 = this.system.addOrbit(new Orbit(0, 0, 150))
        const orbit2 = this.system.addOrbit(new Orbit(0, 0, 220))
        const orbit3 = this.system.addOrbit(new Orbit(0, 0, 270))
        const orbit4 = this.system.addOrbit(new Orbit(0, 0, 360))

        const planet1 = this.system.addPlanet(new Planet(190, 0.1, -1 / 4, Math.PI / 2, 2))
        const planet2a = this.system.addPlanet(new Planet(190, 0.1, -1 / 6, 0, 1))
        const planet2b = this.system.addPlanet(new Planet(190, 0.1, -1 / 6, Math.PI, 1))
        const planet3 = this.system.addPlanet(new Planet(190, 0.1, 1 / 3, Math.PI / 4, 1 / 2))
        const planet4 = this.system.addPlanet(new Planet(190, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4))

        planet1.setOrbit(orbit1)
        planet2a.setOrbit(orbit2)
        planet2b.setOrbit(orbit2)
        planet3.setOrbit(orbit3)
        planet4.setOrbit(orbit4)

        planet2a.createSpawn(true)
        planet2b.createSpawn(true)

        var redTeam = this.system.addTeam(new Team(0xFFAAAA))
        var blueTeam = this.system.addTeam(new Team(0xAAAAFF))
        //var yellowTeam = new Team(0xFFF099)
        //var greenTeam = new Team(0xAAFFAA)

        planet2a.setTeam(redTeam)
        planet2b.setTeam(blueTeam)

        for (var i in this.players) {
            var pack = {
                type: 'setmyteam',
                team: this.system.teams[i].id
            }
            this.players[i].send(JSON.stringify(pack))
        }

        // TODO starting countdown
        this.start()
    }
}

module.exports = Game
