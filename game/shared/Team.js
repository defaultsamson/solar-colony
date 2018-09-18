class Team extends Object {
  constructor(colour, id) {
    super()

    this.players = []
    this.planets = []
    this.colour = colour
    this.id = id
    this.pixels = 0
    this.shipCount = 0
  }

  addPlayer(player) {
    player.team = this
    this.players.push(player)
  }

  removePlayer(player) {
    player.team = null
    let i = this.players.indexOf(player)
    if (i !== -1) {
      this.players.splice(i, 1)
    }
  }

  addPixels(pix) {
    this.pixels += pix
  }

  setPixels(pix) {
    this.pixels = pix
    this.updateClientPixels()
  }

  // Server-side function to update the pixel count for the clients
  updateClientPixels() {
    // Send the updated pixel count to clients
    if (IS_SERVER) {
      let pack = {
        type: Pack.UPDATE_PIXELS,
        pl: this.pixels
      }
      this.sendTeam(pack)
    }
  }

  // Server-side only
  sendTeam(obj) {
    let toSend = JSON.stringify(obj)
    for (let i in this.players) {
      this.players[i].send(toSend)
    }
  }
}

if (IS_SERVER) {
  module.exports = Team
}
