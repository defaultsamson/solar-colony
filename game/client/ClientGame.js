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

      stopSnap()

      /*
      if (sendShipText.clicked(point)) {
        goToSendShipsScreen(focusPlanet, 100)
        return
      }
      */

      let planet = game.system.getPlanet(e.world.x, e.world.y)
      if (planet) {
        // If the viewport is already following the planet that was clicked on, then don't do anything
        let follow = viewport.plugins['follow']
        if (follow && (follow.target === planet)) {
          // Do the zoom if holding shift
          if (PIXI.keyboardManager.isDown(Key.SHIFT)) {
            viewport.snapZoom({
              height: SUN_HEIGHT,
              time: ANIMATION_TIME,
              removeOnComplete: true,
              ease: 'easeInOutSine'
            })
          } else {
            viewport.snapZoom({
              height: PLANET_HEIGHT,
              time: ANIMATION_TIME,
              removeOnComplete: true,
              ease: 'easeInOutSine'
            })
          }

          return
        }

        snappingToPlanet = planet

        // The calculated future positions of the planet
        let pos = planet.calcPosition(ANIMATION_TIME / 1000)

        // Snap to that position
        viewport.snap(pos.x, pos.y, {
          time: ANIMATION_TIME,
          removeOnComplete: true,
          ease: 'easeOutQuart'
        })

        // Do the zoom if not holding shift
        if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
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
      stopFollow()
      centerView()
    }
  }
}
