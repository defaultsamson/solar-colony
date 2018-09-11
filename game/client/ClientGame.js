class ClientGame extends Game {
	constructor(gameID, maxPlayers) {
		super(gameID, maxPlayers)

		this.myTeam = null

		this.diff = 0
	}

	removeSystem() {
		viewport.removeChild(game.system)
		game.system = null
	}

	update(delta) {
		super.update(delta)
		menu.updateIngameGui()

		if (this.countdown) {
			var elapsed = this.targetTime - Date.now()
			setText(Elem.Text.COUNTDOWN, 'Starting Game in ' + Math.ceil(elapsed / 1000))

			if (elapsed <= 0) {
				setHidden(Elem.Text.COUNTDOWN)
				this.countdown = false
				this.play()
				this.update(-elapsed * 0.001)
			}
		}
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

	parse(type, pack) {
		switch (type) {
			case Pack.PAUSE:
				this.countdown = false

				// The difference from the server time to the current time
				this.diff = pack.time - this.time
				console.log('this: ' + this.time)
				console.log('pack: ' + pack.time)
				console.log('diff: ' + this.diff)

				if (this.diff < 0) {
					// Client is now ahead by diff
					// This happens when the server will pause, 
					// then it will take the ping time for this 
					// client to recieve the message
					this.diff = -this.diff

				} else if (this.diff > 0) {
					// Client is now behind by diff
					// Catch up!
					this.update(this.diff * 0.001)
					this.diff = 0
				}

				this.pause()

				menu.gotoPauseMenu()

				break

			case Pack.PLAY:
				this.countdown = true
				this.targetTime = Date.now() + COUNTDOWN_TIME + pack.maxPing + this.diff - socket.ping

				setVisible(Elem.Text.COUNTDOWN)

				setHidden(Elem.Text.ID_DISPLAY1)
				setHidden(Elem.Text.ID_DISPLAY2)
				setHidden(Elem.Text.PAUSE)
				setHidden(Elem.Text.PAUSE_MESSAGE)

				break

			case Pack.CREATE_SPAWN:
				var planet = this.system.getPlanetByID(pack.planet)

				if (pack.force) {
					planet.createSpawn(true)
				} else {
					// 1. subtract the counter that has happened while this packet sent
					// 2. update the spawn counter by creating a spawn
					// 3. push the spawn counter forward by the new rate
					planet.pixelCounter -= planet.pixelRate * socket.ping * 0.001
					planet.createSpawn(false)
					planet.pixelCounter += planet.pixelRate * socket.ping * 0.001
				}

				break

			case Pack.SET_PLANET_TEAM:
				// TODO make a way with the fighting system to check when a planet has captured
				// a planet without needing to use this SET_TEAM_PLANET packet
				var planet = this.system.getPlanetByID(pack.planet)
				var team = this.getTeam(pack.team)
				planet.setTeam(team)
				break

			case Pack.UPDATE_PIXELS: // update pixel count
				this.myTeam.setPixels(pack.pl)
				break

			case Pack.CREATE_SHIPS: // buy ships
				this.system.getPlanetByID(pack.pl).createShips(pack.n, pack.c)
				break
		}
	}
}
