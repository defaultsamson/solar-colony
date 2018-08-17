class System extends(IS_SERVER ? Object : PIXI.Container) {
	constructor() {
		super()

		if (!IS_SERVER) {
			this.sun = new PIXI.particles.Emitter(this, resources.sunTexture.texture, Particle.Sun)
			this.sun.emit = true
		}

		this.orbits = []
		this.sendingShips = []
	}

	update(delta) {
		if (!this.paused) {
			for (var i in this.orbits) {
				this.orbits[i].update(delta)
			}
		}

		if (!IS_SERVER) {
			// Update the sun particle emitter regardless of this.update
			this.sun.update(delta)

			if (!this.paused) {
				// If drawing the ship travel lines
				if (isChoosingShipSend()) {
					updateSelectedPlanet(viewport.toWorld(game.renderer.plugins.interaction.mouse.global))
				}

				for (var i in this.sendingShips) {
					this.sendingShips[i].update(delta)
				}
			}
		}
	}

	addOrbit(orbit) {
		this.orbits.push(orbit)
		orbit.system = this

		if (IS_SERVER) {
			orbit.id = this.game.createID()
		} else {
			this.addChild(orbit)
		}
	}

	getOrbit(id) {
		for (var i in this.orbits)
			if (this.orbits[i].id == id)
				return this.orbits[i]

		return null
	}

	getPlanetByID(id) {
		for (var i in this.orbits) {
			var planet = this.orbits[i].getPlanetByID(id)
			if (planet) return planet
		}
		return null
	}

	getPlanet(x, y) {
		for (var i in this.orbits) {
			var planet = this.orbits[i].getPlanet(x, y)
			if (planet) return planet
		}
		return null
	}

	toJSON() {
		var json = {}

		json.orbits = []
		for (var i in this.orbits) {
			json.orbits.push(this.orbits[i].toJSON())
		}
	}

	static fromJSON(json) {
		var system = new System()

		for (var i in json.orbits) {
			this.addOrbit(Orbit.fromJSON(json.orbits[i]))
		}

		return system
	}
}

if (IS_SERVER) {
	module.exports = System
}
