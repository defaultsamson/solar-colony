// (Client) The max number of ships to display in storage per planet
const maxShips = 100
// (Shared) The max number of spawns permitted
const maxSpawns = 10

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
            this.infantry = new PIXI.particles.Emitter(this, resources.infantry.texture, infantryParticle)
            this.infantry.updateSpawnPos(this.radius, this.radius)

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

        this.infantry.emit = false
        this.infantry.spawnRate = 0
        this.infantry.spawnCounter = 0

        this.radius = this.radius * scale

        this.startAngle = startAngle
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

        if (isServer) {
            addPosition(this)
            // Server-side counter
            this.spawns = 0

        } else {
            this.spawns = []
        }

        this.id = null
        this.ships = []
        this.shipCount = 0
    }

    update(delta) {
        // Age the planet
        this.age += delta;
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
        }

        return 0
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
        for (var i in this.system.myPlanets) {
            if (this == this.system.myPlanets[i]) {
                return true
            }
        }
        return false
    }

    isYourPlanet() {
        for (var i in this.system.yourPlanets) {
            if (this == this.system.yourPlanets[i]) {
                return true
            }
        }
        return false
    }

    createShips(n, cost) {
        if (pixels >= cost) {
            pixels -= cost
            if (!isServer) {
                for (var i = 0; i < n; i++) {
                    if (ships < maxShips) {
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

    spawnCount() {
        return isServer ? this.spawns : this.spawns.length
    }

    createSpawn(force) {
        if (force || (pixels >= 1000 && this.spawnCount() < maxSpawns)) {

            if (!force) {
                pixels -= 1000
            }

            if (!isServer) {
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
            }

            this.updateInfantry()
        }
    }

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

                // Removes the ships from the array
                this.spawns.splice(removeTo, n)
                updatePurchaseHud()
            }

            this.updateInfantry()
        }
    }

    updateInfantry() {
        let spawnsSqr = this.spawnCount() * this.spawnCount()

        this.infantry.spawnRate = spawnsSqr

        this.infantry.maxParticles = spawnsSqr
        this.infantry.frequency = 1 / spawnsSqr

        this.infantry.emit = spawnsSqr > 0
    }

    setOrbit(orbit) {
        this.orbit = orbit

        if (isServer) {
            // Creates the planet on the client-side
            var pack = {
                type: 'setorbit',
                planet: this.id,
                orbit: orbit.id
            }
            this.system.game.player1.send(JSON.stringify(pack))
            // TODO this.game.player2.send(JSON.stringify(pack))
        }
    }
}

if (isServer) {
    module.exports = Planet
}
