class Game extends Object {
	constructor(gameID, maxPlayers) {
		super()

		this.gameID = gameID
		this.maxPlayers = maxPlayers

		this.teams = []
		this.system = null

		// TODO implement game pausing when a player leaves
		this.paused = true
	}

	play() {
		this.paused = false
	}

	pause() {
		this.paused = true
	}

	update(delta) {
		if (this.system && !this.paused) {
			this.system.update(delta)
		}
	}

	addTeam(team) {
		this.teams.push(team)
	}

	getTeam(id) {
		for (var i in this.teams)
			if (this.teams[i].id == id)
				return this.teams[i]

		return null
	}
}

if (IS_SERVER) {
	module.exports = Game
}
