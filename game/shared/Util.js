//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

function distSqr(x1, y1, x2, y2) {
	let x = (x2 - x1)
	let y = (y2 - y1)
	return (x * x) + (y * y)
}

// Tells if the value x is between or equal to y and z within the error margin (error should be positive)
function isBetween(x, y, z, error) {
	if (y > z) {
		return z - error < x && x < y + error
	} else {
		return y - error < x && x < z + error
	}
}

if (isServer) {
	global.distSqr = distSqr
	global.exists = exists
	global.isBetween = isBetween
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

var updateLines = TICKS_PER_COLLISION_UPDATE

var sendShipsFrom
var sendShipsAmount = 0

var selectedPlanet

var mobile
if (!isServer) {
	mobile = (function(a) { return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)) })(navigator.userAgent || navigator.vendor || window.opera)
}

function updateSelectedPlanet(mouse) {
	updateLines++

	if (updateLines > TICKS_PER_COLLISION_UPDATE) {
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
				if (isBetween(0, pX, target.x, SUN_COLLISION_RADIUS) && isBetween(0, pY, target.y, SUN_COLLISION_RADIUS)) {
					// https://math.stackexchange.com/questions/275529/check-if-line-intersects-with-circles-perimeter
					let a = -mY
					let b = mX
					let c = (pX * mY) - (mX * pY)
					var distSquared = (c * c) / (a * a + b * b)

					// if the tradjectory intersects with a planet
					if (distSquared < SUN_COLLISION_RADIUS * SUN_COLLISION_RADIUS) {
						collides = true
					}
				}

				// If it doesn't collide with the sun, test if it collides with a planet
				if (!collides) {
					for (var j in system.planets) {
						if (system.planets[j] != sendShipsFrom && system.planets[j] != planet) {
							// current planet of interest
							let current = system.planets[j]
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

					let radSqr = distSqr(0, 0, 0, planet.radius + PLANET_SELECT_RADIUS)

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
		updateLines = TICKS_PER_COLLISION_UPDATE
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
	elem.style.color = Colour.GREY_TEXT
	elem.style.cursor = 'default'
	elem.onmouseover = function() {
		this.style.backgroundColor = 'transparent'
	}
	elem.setAttribute('enable_click', false)
}

function enableButton(elemID, visible) {
	if (visible || !exists(visible)) {
		var elem = document.getElementById(elemID)
		elem.style.color = '#FFF'
		elem.style.cursor = 'pointer'
		elem.onmouseover = function() {
			this.style.backgroundColor = 'rgba(200, 200, 200, 0.5)'
		}
		elem.onmouseout = function() {
			this.style.backgroundColor = 'transparent'
		}
		elem.setAttribute('enable_click', true)
	} else {
		disableButton(elemID)
	}
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
