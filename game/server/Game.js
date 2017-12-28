class Game extends Object {
    constructor(gameID) {
        super()

        this.gameID = gameID

        this.player1 = null
        this.player2 = null

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

        if (!this.player1) {
            this.player1 = sock
            player = 1
        } else {
            this.player2 = sock
            player = 2
        }

        var packet = {
            type: 'joingame',
            gameID: this.gameID,
            player: player
        }
        sock.send(JSON.stringify(packet))

        if (this.player1 && this.player2) this.start()
    }

    start() {
        var packet = {
            type: 'joingame',
            gameID: this.gameID,
            player: player
        }
        sock.send(JSON.stringify(packet))

        this.pingTest = 30 * 4
    }

    createSystem() {
        console.log('starting the system because I\'m Gay')

        const orbit1 = new Orbit(0, 0, 150)
        const orbit2 = new Orbit(0, 0, 220)
        const orbit3 = new Orbit(0, 0, 270)
        const orbit4 = new Orbit(0, 0, 360)

        const planet1 = new Planet(190, orbit1, 0.1, -1 / 4, Math.PI / 2, 2)
        const planet2a = new Planet(190, orbit2, 0.1, -1 / 6, 0, 1)
        const planet2b = new Planet(190, orbit2, 0.1, -1 / 6, Math.PI, 1)
        const planet3 = new Planet(190, orbit3, 0.1, 1 / 3, Math.PI / 4, 1 / 2)
        const planet4 = new Planet(190, orbit4, 0.1, -0.5, 3 * Math.PI / 4, 1 / 4)

        var planets = [planet1, planet2a, planet2b, planet3, planet4]

        // Setup for testing the game
        var myPlanets = [planet2a]
        var yourPlanets = [planet2b]

        planet2a.createSpawn(true)
        planet2b.createSpawn(true)

        this.system = new System()

        // create the system
        //this.system = something
    }
}

module.exports = Game
