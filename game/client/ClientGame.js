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

	onEscape() {
		if (isChoosingShipSend()) {
			cancelSendShips()
		} else {
			centerView()
		}
	}

	onMouseClick(e) {
		if (this.system) {
			if (isChoosingShipSend()) {
				// updateSelectedPlanet(e.world.x, e.world.y)

				if (selectedPlanet) {
					sendShipsFrom.sendShipsTo(selectedPlanet, sendShipsAmount)
				}
				cancelSendShips()

				return
			}

			/*
			if (sendShipText.clicked(point)) {
				goToSendShipsScreen(focusPlanet, 100)
				return
			}
			*/

			var planet = game.system.getPlanet(e.world.x, e.world.y)
			if (planet) {
				// If the viewport is already following the planet that was clicked on, then don't do anything

				if (focusPlanet != planet) {
					focusPlanet = planet

					// The calculated future positions of the planet
					var pos = planet.calcPosition(ANIMATION_TIME / 1000)

					// Snap to that position
					viewport.snap(pos.x, pos.y, {
						time: ANIMATION_TIME,
						removeOnComplete: true,
						ease: 'easeOutQuart'
					})

					// Do the zoom
					viewport.snapZoom({
						height: PLANET_HEIGHT,
						time: ANIMATION_TIME,
						removeOnComplete: true,
						ease: 'easeInOutSine'
					})
				}

				return
			}

			// If nothing was clicked on, remove the follow plugin
			stopViewport()
			centerView()
		}
	}
}
