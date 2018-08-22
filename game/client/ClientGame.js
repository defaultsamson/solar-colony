class ClientGame extends Game {
	constructor(gameID, maxPlayers) {
		super(gameID, maxPlayers)

		this.myTeam = null
	}

	removeSystem() {
		viewport.removeChild(game.system)
		game.system = null
	}

	update(delta) {
		super.update(delta)
		menu.updateIngameGui()
	}
}
