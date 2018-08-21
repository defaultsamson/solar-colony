if (IS_SERVER) Orbit = require('./Orbit.js')

class System extends(IS_SERVER ? Object : PIXI.Container) {
	constructor(game) {
		super()

		this.game = game

		if (!IS_SERVER) {
			this.sun = new PIXI.particles.Emitter(this, resources.sunTexture.texture, Particle.Sun)
			this.sun.emit = true
		}

		this.orbits = []
		this.sendingShips = []
	}

	update(delta) {
		for (var i in this.orbits) {
			this.orbits[i].update(delta)
		}

		if (!IS_SERVER) {
			this.sun.update(delta)

			// If drawing the ship travel lines
			if (isChoosingShipSend()) {
				updateSelectedPlanet(viewport.toWorld(pixigame.renderer.plugins.interaction.mouse.global))
			}

			for (var i in this.sendingShips) {
				this.sendingShips[i].update(delta)
			}
		}
	}

	addOrbit(orbit) {
		this.orbits.push(orbit)

		if (IS_SERVER) {
			orbit.id = this.game.createID()
		} else {
			this.addChild(orbit)
		}

		return orbit
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

		return json
	}

	static fromJSON(game, json) {
		var system = new System(game)

		for (var i in json.orbits) {
			system.addOrbit(Orbit.fromJSON(game, system, json.orbits[i]))
		}

		return system
	}
}

if (IS_SERVER) {
	module.exports = System
}
