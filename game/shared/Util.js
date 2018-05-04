//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

const localDebug = true

function distSqr(x1, y1, x2, y2) {
	let x = (x2 - x1)
	let y = (y2 - y1)
	return (x * x) + (y * y)
}

// Tells if a value n exists
function exists(n) {
	return typeof n !== 'undefined' && n !== null
}

// Tells if the value x is between or equal to y and z within the error margin (error should be positive)
function isBetween(x, y, z, error) {
	if (y > z) {
		return z - error < x && x < y + error
	} else {
		return y - error < x && x < z + error
	}
}

try {
	if (exists(global)) {
		global.isServer = true
	}
} catch (err) {
	window.isServer = false
}

if (isServer) {
	global.distSqr = distSqr
	global.exists = exists
	global.isBetween = isBetween
	global.localDebug = localDebug
}

//   _____                          
//  / ____|                         
// | (___   ___ _ ____   _____ _ __ 
//  \___ \ / _ \ '__\ \ / / _ \ '__|
//  ____) |  __/ |   \ V /  __/ |   
// |_____/ \___|_|    \_/ \___|_|   

function addPosition(obj) {
	obj.position = {}
	obj.position.x = 0
	obj.position.y = 0

	function setter(x1, y1) {
		obj.position.x = x1
		obj.position.y = y1
	}
	obj.position.set = setter
}

if (isServer) {
	global.addPosition = addPosition
}

//   _____ _ _            _   
//  / ____| (_)          | |  
// | |    | |_  ___ _ __ | |_ 
// | |    | | |/ _ \ '_ \| __|
// | |____| | |  __/ | | | |_ 
//  \_____|_|_|\___|_| |_|\__|

const sunCollisionRadius = 30
const selectPlanetRadius = 55

const ticksPerCollideUpdate = 10
var updateLines = ticksPerCollideUpdate

var sendShipsFrom
var sendShipsAmount = 0

var selectedPlanet

var mobile
if (!isServer) {
	mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)
}

function updateSelectedPlanet(mouse) {
	updateLines++

	if (updateLines > ticksPerCollideUpdate) {
		updateLines = 0
		selectedPlanet = null
	}

	// For each planet, draw a line from the sendShipsFrom planet to it
	for (var i in system.planets) {
		// Don't draw a line from the sendShipsFrom planet to itself
		if (system.planets[i] != sendShipsFrom) {
			let planet = system.planets[i]
			// Only draw lines every update cycle
			if (updateLines == 0) {
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

				planet.drawLine.visible = !collides
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

			planet.drawLine.setPoints(planet.ghost.position.x,
				planet.ghost.position.y,
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
	if (fromPlanet.shipCount >= amount) {
		updateLines = ticksPerCollideUpdate
		sendShipsFrom = fromPlanet
		sendShipsAmount = amount
		viewport.pausePlugin('drag')
		viewport.pausePlugin('wheel')
		centerView()
	}
}

function cancelSendShips() {
	for (var i in system.planets) {
		system.planets[i].outline.visible = false
		system.planets[i].ghost.visible = false
		system.planets[i].ghost.outline.visible = false
		system.planets[i].drawLine.visible = false
	}
	sendShipsFrom = null
	sendShipsAmount = 0
	viewport.resumePlugin('drag')
	viewport.resumePlugin('wheel')
}

function isChoosingShipSend() {
	return sendShipsFrom
}

function setVisible(elemID, visible) {
	if (visible || !exists(visible)) {
		document.getElementById(elemID).style.visibility = 'visible'
	} else {
		setHidden(elemID)
	}
}

function setHidden(elemID) {
	document.getElementById(elemID).style.visibility = 'hidden'
}

function disableButton(elemID) {
	var elem = document.getElementById(elemID)
	deselectButton(elemID)
	elem.style.color = Colour.greyText
	elem.style.cursor = 'default'
	elem.onmouseover = function () {
		this.style.backgroundColor = 'transparent'
	}
	elem.setAttribute('enable_click', false)
}

function enableButton(elemID) {
	var elem = document.getElementById(elemID)
	elem.style.color = '#FFF'
	elem.style.cursor = 'pointer'
	elem.onmouseover = function () {
		this.style.backgroundColor = 'rgba(200, 200, 200, 0.5)'
	}
	elem.onmouseout = function () {
		this.style.backgroundColor = 'transparent'
	}
	elem.setAttribute('enable_click', true)
}

function isButtonEnabled(elemID) {
	var elem = document.getElementById(elemID)
	return elem.hasAttribute('enable_click') ? elem.getAttribute('enable_click') == 'true' : true
}

// Draws a box around the button
function selectButton(elemID) {
	var elem = document.getElementById(elemID)
	// by default elems don't have the enable_click attribute, so treat elems without it as enabled by default
	if (isButtonEnabled(elemID)) {
		elem.style.boxShadow = '0 0 0 3px white'
		elem.setAttribute('button_selected', true)
		setZIndex(elemID, 2)
	}
}

// NOTE
// setting z-index in selectButton and deselectButton is so that the outline for selected buttons properly draws over the highlighting for unselected buttons

function deselectButton(elemID) {
	var elem = document.getElementById(elemID)
	elem.style.boxShadow = 'none'
	elem.setAttribute('button_selected', false)
	setZIndex(elemID, 1)
}

function isSelected(elemID) {
	var elem = document.getElementById(elemID)
	return elem.hasAttribute('button_selected') && elem.getAttribute('button_selected') == 'true'
}

function setZIndex(elemID, z) {
	document.getElementById(elemID).style.zIndex = z
}

function getInput(elemID) {
	return document.getElementById(elemID).value
}

function setText(elemID, text) {
	document.getElementById(elemID).innerHTML = text
}
