// (Client) The max number of ships to display in storage per planet
const maxShips = 100
// (Shared) The max number of spawns permitted
const maxSpawns = 10

class Planet extends(isServer ? Object : PIXI.Sprite) {
    constructor(texture, orbit, scale, rotationConstant, startAngle, opm) {
        super(texture)

        this.radius = isServer ? 0.5 * texture : 0.5 * this.width
        this.orbit = orbit

        if (!isServer) {
            this.pivot.set(this.radius, this.radius)

            // Infantry
            this.infantry = new PIXI.particles.Emitter(this, resources.infantry.texture, infantryParticle)
            this.infantry.updateSpawnPos(this.radius, this.radius)
            this.infantry.emit = false
            this.infantry.spawnRate = 0
            this.infantry.spawnCounter = 0

            // Selection ring
            var ring = new PIXI.Graphics()
            ring.lineStyle(dashThickness * 46, Colour.dark8)
            ring.arc(this.radius, this.radius, this.radius * 3, 0, 7)
            ring.visible = false
            this.outline = this.addChild(ring)

            // Ghost selection ring
            var gring = new PIXI.Graphics()
            gring.lineStyle(scale * dashThickness * 46, Colour.dark8)
            gring.arc(scale * this.radius, scale * this.radius, scale * this.radius * 3, 0, 7)
            gring.visible = false

            // Set the scale
            this.scale.set(scale)
        }

        this.radius = this.radius * scale

        // orbits per minute
        this.opm = opm

        if (!isServer) {
            // Ghosting ring
            var ghost = new PIXI.Graphics()
            ghost.lineStyle(dashThickness * 2, Colour.dark8)
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

        this.ships = []
        this.spawns = []

        this.shipCount = 0
    }

    update(delta) {
        // Age the planet
        this.age += delta;
        var pos = this.calcPosition()
        this.position.set(pos.x, pos.y)
        // Rotate the planet (purely for visual effects)
        this.rotation = this.age * this.rotationConstant
        // Rotate the orbits (purely for visual effects)
        this.orbit.rotation = -this.age * this.speed / 8
        // Updates infantry
        this.infantry.update(delta)

        if (this.isMyPlanet()) {
            this.infantry.spawnCounter += this.infantry.spawnRate * delta

            // Adds the accumulated number of pixels to a user
            let toAdd = Math.floor(this.infantry.spawnCounter)
            if (toAdd > 0) {
                this.infantry.spawnCounter = 0
                pixels += toAdd
            }
        }
    }

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

        do {
            iterations++
            let pos = to.calcPosition(time)

            let d = Math.sqrt((frst - 2 * (x1 * pos.x + y1 * pos.y)) / s1Sqr)

            let delta = d - time

            // The smaller the right side of the < is, the more accurate, but also the more
            if (delta < 0.5) {
                return time
            } else if (delta < 2) {
                time += 0.1
            } else if (delta < 4) {
                time += 0.5
            } else {
                time += 1
            }

            let desired
        } while (iterations < 1000)

        return 0
    }

    calcPosition(additionalAge) {
        if (!additionalAge)
            additionalAge = 0

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
        for (i in system.myPlanets) {
            if (this == system.myPlanets[i]) {
                return true
            }
        }
        return false
    }

    isYourPlanet() {
        for (i in system.yourPlanets) {
            if (this == system.yourPlanets[i]) {
                return true
            }
        }
        return false
    }

    createShips(n, cost) {
        if (pixels >= cost) {
            pixels -= cost
            for (var i = 0; i < n; i++) {
                if (!isServer && ships < maxShips) {
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
            if (!isServer) {
                ships += n
            }
            this.shipCount += n
        }
    }

    removeShips(n) {
        if (!isServer) {
            var visualsToRemove = Math.min(n, Math.max(0, maxShips - ships + n))

            if (visualsToRemove > 0) {
                // Removes the ships from the world
                for (var i = 0; i < visualsToRemove && i < this.ships.length; i++) {
                    this.removeChild(this.ships[i])
                }

                // Removes the ships from the array
                this.ships.splice(0, visualsToRemove)
            }

            ships = Math.max(0, ships - n)
        }
        this.shipCount -= n
    }

    sendShipsTo(toPlanet, amount) {
        this.removeShips(amount)

        let duration = this.timeToFastestIntersect(selectedPlanet)
        var pos = selectedPlanet.calcPosition(duration)

        var ship = this.system.sendingShips.push(system.addChild(new Ship(this.position.x, this.position.y, pos.x, pos.y, shipSpeed, amount, this.tint, toPlanet, duration)))
    }

    createSpawn(force) {
        if (force || (pixels >= 1000 && this.spawns.length < maxSpawns)) {

            if (!force) {
                pixels -= 1000
            }

            var spawn = new PIXI.Sprite(resources.spawn.texture)

            // The position on this planet's surface to place the spawn (the angle)
            // (in radians: imagine that there's a spinner in the planet and this will point outwards somewhere)
            let angle = Math.PI * 6 * this.spawns.length / 10

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

            this.updateInfantry()
        }
    }

    // Removes the spawns from this planet
    removeSpawn(n) {
        let removeTo = (this.spawns.length - n)

        if (removeTo >= 0) {
            for (var i = this.spawns.length - 1; i >= removeTo && i >= 0; i--) {
                this.removeChild(this.spawns[i])
            }

            // Removes the ships from the array
            this.spawns.splice(removeTo, n)
            updatePurchaseHud()

            this.updateInfantry()
        }
    }

    updateInfantry() {
        let spawnsSqr = this.spawns.length * this.spawns.length

        this.infantry.spawnRate = spawnsSqr

        this.infantry.maxParticles = spawnsSqr
        this.infantry.frequency = 1 / spawnsSqr

        this.infantry.emit = spawnsSqr > 0
    }
}
