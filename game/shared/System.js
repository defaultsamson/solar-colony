class System extends(IS_SERVER ? Object : PIXI.Container) {
	constructor() {
		super()

		if (!IS_SERVER) {
			this.sun = new PIXI.particles.Emitter(this, resources.sunTexture.texture, Particle.Sun)
			this.sun.emit = true
		}

		this.orbits = []
		this.planets = []
		this.sendingShips = []
	}

	update(delta, paused) {
		if (!paused) {
			for (var i in this.planets) {
				this.planets[i].update(delta)
			}

			if (!IS_SERVER) {
				// If drawing the ship travel lines
				if (isChoosingShipSend()) {
					updateSelectedPlanet(viewport.toWorld(pixigame.renderer.plugins.interaction.mouse.global))
				}

				// Update all travelling ships
				for (var i in this.sendingShips) {
					this.sendingShips[i].update(delta)
				}
			}
		}

		if (!IS_SERVER) this.sun.update(delta)
	}

	getPlanet(x, y) {
		for (var i in this.planets) {
			let clickRadius = this.planets[i].radius + PLANET_SELECT_RADIUS
			if (distSqr(x, y, this.planets[i].x, this.planets[i].y) < clickRadius * clickRadius) {
				return this.planets[i]
			}
		}

		return null
	}

	addOrbit(orbit) {
		this.orbits.push(orbit)
		orbit.system = this

		if (IS_SERVER) {
			orbit.id = this.game.createID()
			// Creates the orbit on the client-side
			var pack = {
				type: Pack.CREATE_ORBIT,
				id: orbit.id,
				x: orbit.x,
				y: orbit.y,
				radius: orbit.radius
			}
			this.game.sendPlayers(pack)
			return orbit
		} else {
			this.addChild(orbit)
		}
	}

	getOrbit(id) {
		for (var i in this.orbits) {
			if (this.orbits[i].id == id) {
				return this.orbits[i]
			}
		}
		return null
	}

	addPlanet(planet) {
		this.planets.push(planet)
		planet.system = this

		if (IS_SERVER) {
			planet.id = this.game.createID()
			// Creates the planet on the client-side
			var pack = {
				type: Pack.CREATE_PLANET,
				id: planet.id,
				scale: planet.scale,
				rotationConstant: planet.rotationConstant,
				startAngle: planet.startAngle,
				opm: planet.opm
			}
			this.game.sendPlayers(pack)
			return planet
		} else {
			this.addChild(planet)
			var li = new Line(2)
			li.setPoints(0, 0)
			planet.drawLine = this.addChild(li)
		}
	}

	getPlanetByID(id) {
		for (var i in this.planets) {
			if (this.planets[i].id == id) {
				return this.planets[i]
			}
		}
		return null
	}
}

if (IS_SERVER) {
	module.exports = System
}
