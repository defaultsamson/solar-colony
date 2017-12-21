class Game extends Object {
    constructor(gameID) {
        this.gameID = gameID

        this.player1 = null
        this.player2 = null

        this.system = null
    }

    update(delta) {

    }

    addPlayer(sock) {
        if (!this.player1) {
            this.player1 = sock
        } else {
            this.player2 = sock
        }

        if (this.player1 && this.player2) start()
    }



    start() {
        // create the system
        //this.system = something
    }
}

module.exports = Game