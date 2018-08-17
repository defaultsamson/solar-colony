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

	update(delta) {
		// Rotate the orbit (purely for visual effects) 
		// TODO a better way of doing this?
		if (this.planets[0]) {
			this.orbit.rotation = -this.age * this.planets[0].speed / 8
		}

		for (var i in this.planets) {
			this.planets[i].update(delta)
		}
	}

	addPlanet(planet) {
		this.planets.push(planet)
		planet.system = this.system
		planet.orbit = this

		if (IS_SERVER) {
			planet.id = this.game.createID()
		} else {
			this.addChild(planet)
			var li = new Line(2)
			li.setPoints(0, 0)
			planet.drawLine = this.addChild(li)
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
		for (var i in this.planets)
			if (this.planets[i].id == id)
				return this.planets[i]

		return null
	}

	toJSON() {
		var json = {
			id: this.id,
			x: this.x,
			y: this.y,
			radius: this.radius
		}
		json.planets = []

		for (var i in this.planets) {
			json.planets.push(this.planets[i].toJSON())
		}

		return json
	}

	static fromJSON(json) {
		var orbit = new Orbit(json.x, json.y, json.radius)
		orbit.id = json.id

		for (var i in json.planets) {
			this.addPlanet(Planet.fromJSON(json.planets[i]))
		}

		return orbit
	}
}

if (IS_SERVER) {
	module.exports = Orbit
}
