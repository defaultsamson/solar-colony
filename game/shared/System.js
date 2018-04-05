class System extends(isServer ? Object : PIXI.Container) {
    constructor() {
        super()

        if (!isServer) {
            this.sun = new PIXI.particles.Emitter(this, resources.sunTexture.texture, sunParticle)
            this.sun.emit = true
        }

        this.orbits = []
        this.planets = []

        // TODO implement game pausing when a player leaves
        this.updating = false
    }

    play() {
        this.updating = true
    }

    pause() {
        this.updating = false
    }

    update(delta) {
        if (this.updating) {
            for (var i in this.planets) {
                this.planets[i].update(delta)
            }
        }

        if (!isServer) {
            // Update the sun particle emitter regardless of this.update
            this.sun.update(delta)

            if (this.updating) {
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
    }

    getPlanet(x, y) {
        for (var i in this.planets) {
            let clickRadius = this.planets[i].radius + PLANET_CLICK_RADIUS
            if (distSqr(x, y, this.planets[i].x, this.planets[i].y) < clickRadius * clickRadius) {
                return this.planets[i]
            }
        }

        return null
    }

    addOrbit(orbit) {
        this.orbits.push(orbit)
        orbit.system = this

        if (isServer) {
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

        if (isServer) {
            
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

if (isServer) {
    module.exports = System
}
