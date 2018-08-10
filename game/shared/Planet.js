const shipSpeed = 15 // units per second

class Planet extends(isServer ? Object : PIXI.Sprite) {
	constructor(texture, scale, rotationConstant, startAngle, opm) {
		super(texture)

		this.radius = isServer ? 0.5 * texture : 0.5 * this.width

		if (isServer) {
			this.scale = scale
			this.infantry = {}
		} else {
			this.pivot.set(this.radius, this.radius)

			// Infantry
			this.infantry = new PIXI.particles.Emitter(this, resources.infantry.texture, Particle.Infantry)
			this.infantry.updateSpawnPos(this.radius, this.radius)
			this.infantry.emit = false

			// Selection ring
			var ring = new PIXI.Graphics()
			ring.lineStyle(DASH_THICKNESS * 46, Colour.DARK8)
			ring.arc(this.radius, this.radius, this.radius * 3, 0, 7)
			ring.visible = false
			this.outline = this.addChild(ring)

			// Ghost selection ring
			var gring = new PIXI.Graphics()
			gring.lineStyle(scale * DASH_THICKNESS * 46, Colour.DARK8)
			gring.arc(scale * this.radius, scale * this.radius, scale * this.radius * 3, 0, 7)
			gring.visible = false

			// Set the scale
			this.scale.set(scale)
		}

		this.spawnRate = 0
		this.spawnCounter = 0

		this.radius = this.radius * scale

		this.startAngle = startAngle
		// orbits per minute
		this.opm = opm

		if (!isServer) {
			// Ghosting ring
			var ghost = new PIXI.Graphics()
			ghost.lineStyle(DASH_THICKNESS * 2, Colour.DARK8)
			ghost.arc(this.radius, this.radius, this.radius, 0, 7)
			ghost.visible = false
			ghost.pivot.set(this.radius, this.radius)
			ghost.outline = ghost.addChild(gring)
			this.ghost = system.addChild(ghost)
		}

		// The rotation speed in radians/second
		this.speed = opm * (1 / 60) * 2 * Math.PI
		this.rotationConstant = rotationConstant
		this.age = startAngle / this.speed

		if (isServer) {
			addPosition(this)
			// Server-side counter
			this.spawns = 0

		} else {
			this.spawns = []
		}

		this.team = null
		this.id = null
		this.ships = []
		this.shipCount = 0
	}

	update(delta) {
		// Age the planet
		this.age += delta
		var pos = this.calcPosition()
		this.position.set(pos.x, pos.y)
		if (!isServer) {
			// Rotate the planet (purely for visual effects)
			this.rotation = this.age * this.rotationConstant
			if (this.orbit) {
				// Rotate the orbits (purely for visual effects)
				this.orbit.rotation = -this.age * this.speed / 8
			}
			// Updates infantry
			this.infantry.update(delta)
		}

		if (isServer || this.isMyPlanet()) {
			this.spawnCounter += this.spawnRate * delta

			// Adds the accumulated number of pixels to a user
			let toAdd = Math.floor(this.spawnCounter)
			if (toAdd > 0) {
				this.spawnCounter -= toAdd
				this.team.pixels += toAdd
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
		return exists(this.team) ? this.team.id === myTeam.id : false
	}

	isTeamsPlanet(team) {
		return this.team.id === team.id
	}

	setTeam(team) {
		this.team = team

		if (isServer) {
			// Creates the planet on the client-side
			var pack = {
				type: Pack.SET_PLANET_TEAM,
				planet: this.id,
				team: team.id
			}
			this.system.game.sendPlayers(pack)
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
		socket.ws.send(JSON.stringify(pack))
	}

	createShips(n, cost) {
		if (isServer) {
			// Validate to make sure the client isn't lying about the packet
			if (this.team.pixels >= cost && n > 0) {
				var good = false
				if (n <= 1 && cost >= 10) {
					good = true
				} else if (n <= 10 && cost >= 90) {
					good = true
				} else if (n <= 100 && cost >= 800) {
					good = true
				}

				if (good) {
					this.shipCount += n
					this.team.pixels -= cost
					this.team.updateClientPixels()

					this.system.game.sendPlayers({
						type: Pack.BUY_SHIPS,
						pl: this.id,
						n: n
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
					let h = this.radius / this.scale.x + distFromPlanet
					let o = h * Math.sin(angle)
					let a = h * Math.cos(angle)
					let x = a + this.radius / this.scale.x
					let y = o + this.radius / this.scale.x

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
		}
	}

	removeShips(n) {
		if (!isServer) {
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
		return isServer ? this.spawns : this.spawns.length
	}

	// A client-side function for ease of use
	createSpawnClick() {
		var pack = {
			type: Pack.CREATE_SPAWN,
			pl: this.id, // planet
		}
		socket.ws.send(JSON.stringify(pack))
	}

	createSpawn(force) {
		var good = false
		var nextSpawn = true; // TODO
		if (!isServer) {
			if (this.team && !force) this.team.pixels -= 1000
			var spawn = new PIXI.Sprite(resources.spawn.texture)

			// The position on this planet's surface to place the spawn (the angle)
			// (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
			let angle = Math.PI * 6 * this.spawnCount() / 10

			let distFromPlanet = -8

			// hypotenuse, opposite, adjacent
			let h = this.radius / this.scale.x + distFromPlanet
			let o = h * Math.sin(angle)
			let a = h * Math.cos(angle)
			let x = a + this.radius / this.scale.x
			let y = o + this.radius / this.scale.x

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
			} else if (this.team.pixels >= 1000 && this.spawnCount() < MAX_SPAWNS) {
				good = true
				this.team.pixels -= 1000
			}

			if (good) {
				var pack = {
					type: Pack.CREATE_SPAWN,
					planet: this.id,
					force: this.force
				}
				this.system.game.sendPlayers(pack)
				this.spawns++
			}
		}

		// Updates the pixel spawn rate
		if (good) {
			let spawnsSqr = this.spawnCount() * this.spawnCount()

			this.spawnRate = spawnsSqr

			if (!isServer) {
				this.infantry.maxParticles = spawnsSqr
				this.infantry.frequency = 1 / spawnsSqr

				this.infantry.emit = spawnsSqr > 0
			}
		}
	}

	/* We don't neccessarily need this at all
	// Removes the spawns from this planet
	removeSpawn(n) {
		let removeTo = this.spawnCount() - n

		if (removeTo >= 0) {
			if (isServer) {
				this.spawnCount = removeTo
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

	setOrbit(orbit) {
		this.orbit = orbit

		if (isServer) {
			// Sets the planet's orbit on the client-side
			var pack = {
				type: Pack.SET_PLANET_ORBIT,
				planet: this.id,
				orbit: orbit.id
			}
			this.system.game.sendPlayers(pack)
		}
	}
}

if (isServer) {
	module.exports = Planet
}
