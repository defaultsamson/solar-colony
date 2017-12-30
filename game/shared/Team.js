class Team extends Object {
    constructor(colour) {
        super()
        
        this.planets = []
        this.colour = colour
        this.pixels = 0
    }
    
    addPlayer(sock) {
        sock.team = this
    }
}

if (isServer) {
    module.exports = Team
}