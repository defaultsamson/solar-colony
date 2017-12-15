const sunCollisionRadius = 30
const selectPlanetRadius = 55

const ticksPerCollideUpdate = 10
var updateLines = ticksPerCollideUpdate

var sendShipsFrom
var sendShipsAmount = 0

var selectedPlanet

function updateSelectedPlanet(mouse) {
    updateLines++

    if (updateLines > ticksPerCollideUpdate) {
        updateLines = 0
        selectedPlanet = null
    }

    // For each planet, draw a line from the sendShipsFrom planet to it
    for (i in system.planets) {
        // Don't draw a line from the sendShipsFrom planet to itself
        if (system.planets[i] != sendShipsFrom) {
            // Only draw lines every update cycle
            if (updateLines == 0) {
                let planet = system.planets[i]
                planet.outline.visible = false
                planet.ghost.outline.visible = false

                // Player Planet
                let pX = sendShipsFrom.position.x
                let pY = sendShipsFrom.position.y

                let targetTime = sendShipsFrom.timeToFastestIntersect(planet)
                let target = planet.calcPosition(targetTime)

                // Line Slope (origin is the Planet Player pos)
                let mX = target.x - pX
                let mY = target.y - pY

                var collides = false

                // Tests collision for the sun (same as above with planets)
                if (isBetween(0, pX, target.x, sunCollisionRadius) && isBetween(0, pY, target.y, sunCollisionRadius)) {
                    // https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
                    let a = -mY
                    let b = mX
                    let c = (pX * mY) - (mX * pY)
                    var distSquared = (c * c) / (a * a + b * b)

                    // if the tradjectory intersects with a planet
                    if (distSquared < sunCollisionRadius * sunCollisionRadius) {
                        collides = true
                    }
                }

                // If it doesn't collide with the sun, test if it collides with a planet
                if (!collides) {
                    for (n in system.planets) {
                        if (system.planets[n] != sendShipsFrom && system.planets[n] != planet) {
                            // current planet of interest
                            let current = system.planets[n]
                            let cPos = current.calcPosition(targetTime)
                            // If the target is within the bounds of the two planets
                            if (isBetween(cPos.x, pX, target.x, current.radius) && isBetween(cPos.y, pY, target.y, current.radius)) {
                                // https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
                                let a = -mY
                                let b = mX
                                let c = (pX * mY) - (mX * pY)
                                let numerator = (a * cPos.x + b * cPos.y + c)
                                var distSquared = (numerator * numerator) / (a * a + b * b)

                                // if the tradjectory intersects with a planet
                                if (distSquared < current.radius * current.radius) {
                                    collides = true
                                    break
                                }
                            }
                        }
                    }
                }

                system.drawLines[i].visible = !collides
                planet.ghost.visible = !collides

                if (planet.ghost.visible = !collides) {
                    planet.ghost.position.set(target.x, target.y)
                }

                // Planet selection via mouse
                if (!collides) {
                    let targetDist = distSqr(mouse.x, mouse.y, target.x, target.y)
                    let planetDist = distSqr(mouse.x, mouse.y, planet.position.x, planet.position.y)

                    let radSqr = distSqr(0, 0, 0, selectPlanetRadius + planet.radius)

                    if (targetDist < radSqr || planetDist < radSqr) {
                        if (!selectedPlanet) {
                            selectedPlanet = planet
                        } else {
                            // if the mouse is within the selection radius of the planet

                            let selectedDist = distSqr(mouse.x, mouse.y, selectedPlanet.position.x, selectedPlanet.position.y)
                            let selectedGhostDist = distSqr(mouse.x, mouse.y, selectedPlanet.ghost.position.x, selectedPlanet.ghost.position.y)

                            if ((targetDist < selectedDist && targetDist < selectedGhostDist) || (planetDist < selectedDist && planetDist < selectedGhostDist)) {
                                selectedPlanet = planet
                            }
                        }
                    }
                }
            }

            system.drawLines[i].setPoints(system.planets[i].ghost.position.x,
                system.planets[i].ghost.position.y,
                sendShipsFrom.position.x,
                sendShipsFrom.position.y)
        }
    }

    if (updateLines == 0) {
        if (selectedPlanet) {
            selectedPlanet.outline.visible = true
            selectedPlanet.ghost.outline.visible = true
        }
    }
}


function goToSendShipsScreen(fromPlanet, amount) {
    if (ships >= amount) {
        updateLines = ticksPerCollideUpdate
        sendShipsFrom = fromPlanet
        sendShipsAmount = amount
        viewport.pausePlugin('drag')
        viewport.pausePlugin('wheel')
        centerView()
    }
}

function cancelSendShips() {
    for (i in system.drawLines) {
        system.drawLines[i].visible = false
    }
    for (i in system.planets) {
        system.planets[i].outline.visible = false
        system.planets[i].ghost.visible = false
        system.planets[i].ghost.outline.visible = false
    }
    sendShipsFrom = null
    sendShipsAmount = 0
    viewport.resumePlugin('drag')
    viewport.resumePlugin('wheel')
}

function isChoosingShipSend() {
    return sendShipsFrom
}
