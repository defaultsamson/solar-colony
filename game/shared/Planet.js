const shipSpeed = 15 // units per second

class Planet extends(IS_SERVER ? Object : PIXI.Sprite) {
	constructor(radius, rotationConstant, startAngle, opm, system) {
		if (IS_SERVER) {
			super()
		} else {
			super(resources.planet1.texture)
		}

		this.radius = radius

		if (IS_SERVER) {
			this.infantry = {}
		} else {
			var scale = radius / this.width
			this.pixelRadius = this.width / 2

			this.pivot.set(this.pixelRadius, this.pixelRadius)

			// Infantry
			this.infantry = new PIXI.particles.Emitter(this, resources.infantry.texture, Particle.Infantry)
			this.infantry.updateSpawnPos(this.pixelRadius, this.pixelRadius)
			this.infantry.emit = false

			// Selection ring
			var ring = new PIXI.Graphics()
			ring.lineStyle(DASH_THICKNESS * 46, Colour.DARK8)
			ring.arc(this.pixelRadius, this.pixelRadius, this.pixelRadius * 3, 0, 7)
			ring.visible = false
			this.outline = this.addChild(ring)

			// Ghost selection ring
			var gring = new PIXI.Graphics()
			gring.lineStyle(scale * DASH_THICKNESS * 46, Colour.DARK8)
			gring.arc(scale * this.pixelRadius, scale * this.pixelRadius, scale * this.pixelRadius * 3, 0, 7)
			gring.visible = false

			// Set the scale
			this.scale.set(scale)
		}

		this.pixelRate = 0
		this.pixelCounter = 0

		this.startAngle = startAngle
		// orbits per minute
		this.opm = opm

		if (!IS_SERVER) {
			// Ghosting ring
			var ghost = new PIXI.Graphics()
			ghost.lineStyle(DASH_THICKNESS * 2, Colour.DARK8)
			ghost.arc(this.pixelRadius, this.pixelRadius, this.pixelRadius, 0, 7)
			ghost.visible = false
			ghost.pivot.set(this.pixelRadius, this.pixelRadius)
			ghost.outline = ghost.addChild(gring)
			this.ghost = system.addChild(ghost)

			var li = new Line(2)
			li.setPoints(0, 0)
			this.drawLine = system.addChild(li)
		}

		// The rotation speed in radians/second
		this.speed = opm * (1 / 60) * 2 * Math.PI
		this.rotationConstant = rotationConstant
		this.age = startAngle / this.speed

		if (IS_SERVER) {
			addPosition(this)
			// Server-side counter
			this.spawns = 0

		} else {
			this.spawns = []
		}

		this.team = null
		this.ships = []
		this.shipCount = 0
	}

	update(delta) {
		// Age the planet
		this.age += delta
		this.updatePosition()
		if (!IS_SERVER) {
			// Rotate the planet (purely for visual effects)
			this.rotation = this.age * this.rotationConstant
			// Updates infantry
			this.infantry.update(delta)
		}

		if (IS_SERVER || this.isMyPlanet()) {
			this.pixelCounter += this.pixelRate * delta

			// Adds the accumulated number of pixels to a user
			let toAdd = Math.floor(this.pixelCounter)
			if (toAdd > 0) {
				this.pixelCounter -= toAdd
				this.team.addPixels(toAdd)
			}
		}
	}

	// to = target planet
	timeToFastestIntersect(to) {
		// Can be ound on Desmos here https://www.desmos.com/calculator/ksdkwjxmdx

		let r = to.orbit.radius
		let x1 = this.position.x
		let y1 = this.position.y
		let s1Sqr = shipSpeed * shipSpeed

		// The first part of the equation
		let frst = (r * r) + (x1 * x1) + (y1 * y1)

		var time = 0
		var iterations = 0

		while (iterations < 1000) {
			iterations++
			let pos = to.calcPosition(time)

			let d = Math.sqrt((frst - 2 * (x1 * pos.x + y1 * pos.y)) / s1Sqr)

			let epsilon = d - time

			// The smaller the right side of the < is, the more accurate, but also the more
			if (epsilon < 0.5) {
				return time
			} else if (epsilon < 2) {
				time += 0.1
			} else if (epsilon < 4) {
				time += 0.5
			} else {
				time += 1
			}
		}

		return time
	}

	updatePosition() {
		var pos = this.calcPosition()
		this.position.set(pos.x, pos.y)
	}

	calcPosition(additionalAge) {
		if (!additionalAge)
			additionalAge = 0

		if (!this.orbit) {
			return {
				x: 0,
				y: 0
			}
		}

		let radius = this.orbit.radius
		let age = this.age + additionalAge
		let x = Math.cos(age * this.speed) * radius
		let y = Math.sin(age * this.speed) * radius
		return {
			x: x,
			y: y
		}
	}

	isMyPlanet() {
		// Client-side only
		return exists(this.team) ? this.team.id === game.myTeam.id : false
	}

	isTeamsPlanet(team) {
		return this.team.id === team.id
	}

	setTeam(team) {
		this.team = team

		if (IS_SERVER) {
			// Creates the planet on the client-side
			/* Will we need this???
			var pack = {
				type: Pack.SET_PLANET_TEAM,
				planet: this.id,
				team: team.id
			}
			this.system.game.sendPlayers(pack)
			*/
		} else {
			var colour = exists(team) ? team.colour : 0xFFFFFF
			this.tint = colour
			this.outline.tint = colour
			this.ghost.tint = colour
			this.ghost.outline.tint = colour
			this.drawLine.tint = colour
			for (var i in this.spawns) {
				this.spawns[i].tint = colour
			}
		}
	}

	// A client-side function for ease of use
	createShipsClick(n, cost) {
		var pack = {
			type: Pack.BUY_SHIPS,
			pl: this.id, // planet
			n: n, // n 
			c: cost // cost
		}
		socket.send(pack)
	}

	createShips(n, cost) {
		if (n <= 0) return
		if (IS_SERVER) {
			// Validate to make sure the client isn't lying about the packet
			if (this.team.pixels >= cost && n > 0) {
				var good = false
				if (n <= 10 && cost >= 10) {
					good = true
				} else if (n <= 100 && cost >= 90) {
					good = true
				} else if (n <= 1000 && cost >= 800) {
					good = true
				}
				if (good) {
					this.shipCount += n
					this.team.addPixels(-cost)
					this.system.game.sendPlayers({
						type: Pack.BUY_SHIPS,
						pl: this.id,
						n: n,
						c: cost
					})
				}
			}
		} else {
			for (var i = 0; i < n; i++) {
				if (this.shipCount + i < MAX_DISPLAY_SHIPS) {
					var ship = new PIXI.Sprite(resources.ship.texture)

					// The position on the planet's surface to place the ship (the angle)
					// (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
					let angle = Math.PI * 2 * Math.random()

					let distFromPlanet = 60

					// hypotenuse, opposite, adjacent
					let h = this.pixelRadius + distFromPlanet
					let o = h * Math.sin(angle)
					let a = h * Math.cos(angle)
					let x = a + this.pixelRadius
					let y = o + this.pixelRadius

					ship.tint = this.tint
					ship.pivot.set(ship.width * 0.5, ship.height * 0.5)
					ship.position.set(x, y)
					ship.rotation = angle + (Math.PI / 2)
					this.addChild(ship)
					this.ships.push(ship)
				}
			}
			// Must keep these after the above for loop ^ otherwise the incorrect number of whips will display due to the if statement
			this.shipCount += n
			this.team.shipCount += n
			this.team.addPixels(-cost)
		}
	}

	removeShips(n) {
		if (!IS_SERVER) {
			var visualsToRemove = Math.min(n, Math.max(0, MAX_DISPLAY_SHIPS - this.shipCount + n))

			if (visualsToRemove > 0) {
				// Removes the ships from the world
				for (var i = 0; i < visualsToRemove && i < this.ships.length; i++) {
					this.removeChild(this.ships[i])
				}

				// Removes the ships from the array
				this.ships.splice(0, visualsToRemove)
			}
		}
		this.shipCount = this.shipCount - n
		this.team.shipCount -= n
	}

	sendShipsTo(toPlanet, amount) {
		this.removeShips(amount)

		let duration = this.timeToFastestIntersect(selectedPlanet)
		var pos = selectedPlanet.calcPosition(duration)

		var ship = this.system.sendingShips.push(system.addChild(new Ship(this.position.x, this.position.y, pos.x, pos.y, shipSpeed, amount, this.tint, toPlanet, duration)))
	}

	spawnCount() {
		return IS_SERVER ? this.spawns : this.spawns.length
	}

	// A client-side function for ease of use
	createSpawnClick() {
		var pack = {
			type: Pack.CREATE_SPAWN,
			pl: this.id, // planet
		}
		socket.send(pack)
	}

	createSpawn(force) {
		var good = false
		var nextSpawn = true; // TODO
		if (!IS_SERVER) {
			if (this.team && !force) {
				this.team.addPixels(-200)
			}
			var spawn = new PIXI.Sprite(resources.spawn.texture)

			// The position on this planet's surface to place the spawn (the angle)
			// (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
			let angle = Math.PI * 6 * this.spawnCount() / 10

			let distFromPlanet = -8

			// hypotenuse, opposite, adjacent
			let h = this.pixelRadius + distFromPlanet
			let o = h * Math.sin(angle)
			let a = h * Math.cos(angle)
			let x = a + this.pixelRadius
			let y = o + this.pixelRadius

			spawn.tint = this.tint
			spawn.pivot.set(spawn.width * 0.5, spawn.height)
			spawn.scale.set(1.3)
			spawn.position.set(x, y)
			spawn.rotation = angle + (Math.PI / 2)
			this.addChild(spawn)
			this.spawns.push(spawn)

			//this.updateInfantry()
			good = true
		} else {
			if (force) {
				good = true
			} else if (this.team.pixels >= 200 && this.spawnCount() < MAX_SPAWNS) {
				good = true
				this.team.addPixels(-200)
			}

			if (good) {
				var pack = {
					type: Pack.CREATE_SPAWN,
					planet: this.id,
					force: force
				}
				this.system.game.sendPlayers(pack)
				this.spawns++
			}
		}

		// Updates the pixel spawn rate
		if (good) {
			this.pixelRate = MAX_PIXEL_RATE * Math.log(this.spawnCount() + 1) / SPAWN_LN

			if (!IS_SERVER) {
				this.infantry.maxParticles = this.pixelRate
				if (this.pixelRate > 0) {
					this.infantry.frequency = 1 / this.pixelRate
					this.infantry.emit = true
				} else {
					this.infantry.emit = false
				}
			}
		}
	}

	/* We don't neccessarily need this at all
	// Removes the spawns from this planet
	removeSpawn(n) {
		let removeTo = this.spawnCount() - n

		if (removeTo >= 0) {
			if (IS_SERVER) {
				this.spawns = removeTo
			} else {
				for (var i = this.spawns.length - 1; i >= removeTo && i >= 0; i--) {
					this.removeChild(this.spawns[i])
				}

				// Removes the spawns from the array
				this.spawns.splice(removeTo, n)
				updatePurchaseHud()
			}

			this.updateInfantry()
		}
	}*/

	save(literal) {
		if (!exists(literal)) literal = true

		var pla = {
			radius: this.radius,
			rotationConstant: this.rotationConstant,
			startAngle: this.startAngle,
			opm: this.opm
		}
		if (literal) {
			pla.id = this.id
			pla.team = this.team ? this.team.id : -1
			pla.shipCount = this.shipCount
			pla.spawnCount = this.spawnCount()
			pla.pixelCounter = this.pixelCounter
			pla.age = this.age
		}
		return pla
	}

	static load(json, game, system) {
		var pla = new Planet(json.radius, json.rotationConstant, json.startAngle, json.opm, system)
		if (exists(json.id)) pla.id = json.id
		if (exists(json.team)) pla.setTeam(game.getTeam(json.team))
		if (exists(json.shipCount)) pla.createShips(json.shipCount)
		if (exists(json.spawnCount)) {
			for (var i = 0; i < json.spawnCount; i++)
				pla.createSpawn(true)
		}
		if (exists(json.pixelCounter)) pla.pixelCounter = json.pixelCounter
		if (exists(json.age)) pla.age = json.age

		pla.updatePosition()

		return pla
	}
}

if (IS_SERVER) {
	module.exports = Planet
}
