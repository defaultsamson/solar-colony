// The extra pixels to add to the radius of a planet to determine whether to select it when clicked
const clickThreshold = 40

class System extends(isServer ? Object : PIXI.Container) {
    constructor() {
        super()

        if (isServer) {
            this.ids = 0
        } else {
            this.sun = new PIXI.particles.Emitter(this, resources.sunTexture.texture, sunParticle)
            this.sun.emit = true
        }

        this.orbits = []
        this.planets = []
        this.teams = []
    }

    update(delta) {
        for (var i in this.planets) {
            this.planets[i].update(delta)
        }

        if (!isServer) {
            // Update the sun particle emitter
            this.sun.update(delta)

            // If drawing the ship travel lines
            if (isChoosingShipSend()) {
                updateSelectedPlanet(viewport.toWorld(game.renderer.plugins.interaction.mouse.global))
            }

            // Move into System class
            for (var i in this.planets) {
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

    addTeam(team) {
        this.teams.push(team)
        team.system = this

        if (isServer) {
            team.id = this.createID()

            var pack = {
                type: 'createteam',
                id: team.id,
                colour: team.colour
            }
            this.game.sendPlayers(pack)
            return team
        }
    }

    getTeam(id) {
        for (var i in this.teams) {
            if (this.teams[i].id == id) {
                return this.teams[i]
            }
        }
        return null
    }

    addOrbit(orbit) {
        this.orbits.push(orbit)
        orbit.system = this

        if (isServer) {
            orbit.id = this.createID()
            // Creates the orbit on the client-side
            var pack = {
                type: 'createorbit',
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

        if (isServer) {
            planet.id = this.createID()
            // Creates the planet on the client-side
            var pack = {
                type: 'createplanet',
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
        }
    }

    getPlanet(id) {
        for (var i in this.planets) {
            if (this.planets[i].id == id) {
                return this.planets[i]
            }
        }
        return null
    }

    createID() {
        return this.ids++
    }
}

if (isServer) {
    module.exports = System
}
