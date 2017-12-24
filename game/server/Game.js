class Game extends Object {
    constructor(gameID) {
        super()

        this.gameID = gameID

        this.player1 = null
        this.player2 = null

        this.system = null
    }

    update(delta) {

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
        console.log('starting the system because I\'m Gay')
        // create the system
        //this.system = something
    }
}

module.exports = Game
