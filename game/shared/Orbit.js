class Orbit extends(IS_SERVER ? Object : PIXI.Graphics) {
	constructor(x, y, radius) {
		super()

		this.x = x
		this.y = y
		this.radius = radius
		this.planets = []

		if (!IS_SERVER) {
			var numOfDashes = Math.max(Math.floor(Math.PI * radius / DASH_LENGTH), MIN_DASHES)
			var dashRadians = DASH_LENGTH / radius
			var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

			// If it's a full circle, draw it full (more optimised)
			if (spacingRadians <= 0) {
				this.lineStyle(DASH_THICKNESS, Colour.DASHED_LINE) //(thickness, color)
				this.arc(x, y, radius, 0, 2 * Math.PI)
			} else { // Else, draw it dashed
				for (var i = 0; i < numOfDashes; i++) {
					var start = i * (dashRadians + spacingRadians)
					var end1 = start + dashRadians
					var end2 = end1 + spacingRadians
					this.lineStyle(DASH_THICKNESS, Colour.DASHED_LINE) //(thickness, color)
					this.arc(x, y, radius, start, end1)
					this.lineStyle(DASH_THICKNESS, Colour.BACKGROUND, 0)
					this.arc(x, y, radius, end1, end2)
				}
			}

			// disgusting
			// this.cacheAsBitmap = true
		}
	}

	addPlanet(planet) {
		this.planets.push(planet)
		planet.game = this.game
		planet.system = this.system
		planet.orbit = this

		if (IS_SERVER) {
			planet.id = planet.game.createID()
			return planet
		} else {
			planet.system.addChild(planet)
		}
	}

	update(delta) {
		var first = true
		for (var i in this.planets) {
			this.planets[i].update(delta)

			if (first && !IS_SERVER) {
				// Rotate the orbits (purely for visual effects)
				// TODO make their rotation separate from the planet speeds
				this.rotation = -this.planets[i].age * this.planets[i].speed / 8
				first = false
			}
		}
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

	getPlanetByID(id) {
		for (var i in this.planets) {
			if (this.planets[i].id == id) {
				return this.planets[i]
			}
		}
		return null
	}

	save(literal) {
		if (!exists(literal)) literal = true

		var orb = {
			x: this.x,
			y: this.y,
			radius: this.radius,
			planets: []
		}
		if (literal) orb.id = this.id

		for (var i in this.planets) {
			orb.planets.push(this.planets[i].save(literal))
		}

		return orb
	}

	static load(json, game, system) {
		var orb = new Orbit(json.x, json.y, json.radius)
		if (exists(json.id)) orb.id = json.id

		// TODO make orbits independant of the system, and 
		// make planets independant of the game and system.
		// Then we can move this addOrbit call to the System.load
		// in the same fashion as the addPlanet call is in the
		// loop below
		system.addOrbit(orb)

		for (var i in json.planets)
			orb.addPlanet(Planet.load(json.planets[i], game, system))

		return orb
	}
}

if (IS_SERVER) {
	module.exports = Orbit
}
