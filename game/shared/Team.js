class Team extends Object {
    constructor(colour, id) {
        super()

        this.players = []
        this.planets = []
        this.colour = colour
        this.id = id
        this.pixels = 0
    }

    addPlayer(player) {
        player.team = this
        this.players.push(player)
    }

    removePlayer(player) {
        player.team = null
        var i = this.players.indexOf(player)
        if (i != -1) {
            this.players.splice(i, 1)
        }
    }
}

if (isServer) {
    module.exports = Team
}
