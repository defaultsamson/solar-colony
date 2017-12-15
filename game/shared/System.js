// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40

class System extends Object {
    constructor(sun, planets, drawLines, myPlanets, yourPlanets) {
        super()

        this.sun = sun
        this.planets = planets
        this.drawLines = drawLines
        this.myPlanets = myPlanets
        this.yourPlanets = yourPlanets
        this.ships = ships
    }

    update(delta) {
        // Update the sun particle emitter
        this.sun.update(delta)

        for (i in this.planets) {
            this.planets[i].update(delta)
        }

        if (!isServer) {
            // If drawing the ship travel lines
            if (isChoosingShipSend()) {
                updateSelectedPlanet(viewport.toWorld(game.renderer.plugins.interaction.mouse.global))
            }

            // Move into Game class
            for (i in this.planets) {
                for (var k in this.planets[i].sendingShips) {
                    this.planets[i].sendingShips[k].update(delta)
                }
            }
        }
    }

    getPlanet(x, y) {
        for (var i in this.planets) {
            let clickThresh = (this.planets[i].radius + clickThreshold)
            if (distSqr(x, y, this.planets[i].x, this.planets[i].y) < clickThresh * clickThresh) {
                return this.planets[i]
            }
        }

        return null
    }
}
