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
		if (this.system) {
			this.system.update(delta, this.paused)
		}
	}

	addTeam(team) {
		this.teams.push(team)
	}

	// Rebuilds the teams (removes empty teams from the list)
	rebuildTeams() {
		var tempTeams = []
		for (var i in this.teams) {
			if (this.teams[i].players.length > 0) {
				tempTeams.push(this.teams[i])
			}
		}
		this.teams = tempTeams
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
