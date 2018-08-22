//   _____      _               
//  / ____|    | |              
// | (___   ___| |_ _   _ _ __  
//  \___ \ / _ \ __| | | | '_ \ 
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/ 
//                       | |    
//                       |_|   

var game
var pixigame
var menu
var socket
var viewport
var resources

window.onload = function() {
	// Creates the PIXI application
	pixigame = new PIXI.Application(INIT_WIDTH, INIT_HEIGHT, {
		antialias: true,
		transparent: false
	})

	// Sets up the 
	window.onorientationchange = resize
	window.onresize = resize
	pixigame.view.style.position = 'absolute'
	pixigame.view.style.display = 'block'
	document.body.insertBefore(pixigame.view, document.getElementById(TOP_DIV))
	pixigame.renderer.autoResize = true
	pixigame.renderer.backgroundColor = Colour.BACKGROUND
	document.addEventListener('contextmenu', event => event.preventDefault())

	// Viewport options. Not very important because it can vary (see resize() )
	// These are mostly just used for initialization so that no errors occur
	const viewportOptions = {
		screenWidth: INIT_WIDTH,
		screenHeight: INIT_HEIGHT,
		worldWidth: INIT_WIDTH,
		worldHeight: INIT_HEIGHT,
		ticker: pixigame.ticker
	}

	viewport = new Viewport(viewportOptions)
	pixigame.stage.addChild(viewport)

	const clampOptions = {
		minWidth: 1,
		minHeight: MIN_HEIGHT,
		maxWidth: 1000 * INIT_WIDTH,
		maxHeight: MAX_HEIGHT
	}

	const pinchOptions = {
		percent: 4.5
	}

	viewport
		.drag()
		.wheel()
		.pinch(pinchOptions)
		.clampZoom(clampOptions)
		.decelerate()

	viewport.on('drag-start', function(e) {
		stopSnap()
		stopFollow()
	})
	viewport.on('pinch-start', stopSnap)
	viewport.on('wheel', stopSnap)
	viewport.on('clicked', onMouseClick)

	// Upon ending of the snap, if it was just snapping to a planet, begin to follow it
	viewport.on('snap-end', function() {
		if (snappingToPlanet) {
			viewport.follow(snappingToPlanet)
			focusPlanet = snappingToPlanet
		}
		stopSnap()
	})

	viewport.fitHeight(SUN_HEIGHT)
	viewport.moveCenter(0, 0)

	lastElapsed = Date.now()
	pixigame.ticker.add(gameLoop)

	socket = new SocketManager()
	socket.connect()

	menu = new Menu()
	menu.gotoTitle()
	resize()

	PIXI.loader
		.add('sunTexture', 'game/assets/sun.png')
		.add('planet1', 'game/assets/planet1.png')
		.add('planet2', 'game/assets/planet2.png')
		.add('ship', 'game/assets/ship.png')
		.add('spawn', 'game/assets/spawn.png')
		.add('infantry', 'game/assets/infantry.png')
		.load((loader, res) => { resources = res })
}

//  _____                   _   
// |_   _|                 | |  
//   | |  _ __  _ __  _   _| |_ 
//   | | | '_ \| '_ \| | | | __|
//  _| |_| | | | |_) | |_| | |_ 
// |_____|_| |_| .__/ \__,_|\__|
//             | |              
//             |_|              

var snappingToPlanet = false
var snappingToCenter = false

function stopSnap() {
	snappingToPlanet = false
	snappingToCenter = false
	viewport.removePlugin('snap')
	viewport.removePlugin('snap-zoom')
}

function stopFollow() {
	viewport.removePlugin('follow')
	focusPlanet = null
}

function centerView() {
	if (!snappingToCenter) {
		stopSnap()
		snappingToCenter = true
		stopFollow()
		viewport.snap(0, 0, {
			time: ANIMATION_TIME,
			removeOnComplete: true,
			center: true,
			ease: 'easeInOutSine'
		})

		viewport.snapZoom({
			height: SUN_HEIGHT,
			time: ANIMATION_TIME,
			removeOnComplete: true,
			center: true,
			ease: 'easeOutQuart'
		})
	}
}

function onMouseClick(e) {
	if (allowMouseClick) {
		if (game && game.system) {
			if (isChoosingShipSend()) {
				// updateSelectedPlanet(e.world.x, e.world.y)

				if (selectedPlanet) {
					sendShipsFrom.sendShipsTo(selectedPlanet, sendShipsAmount)
				}
				cancelSendShips()

				return
			}

			stopSnap()

			/*
			if (sendShipText.clicked(point)) {
				goToSendShipsScreen(focusPlanet, 100)
				return
			}*/

			var planet = game.system.getPlanet(e.world.x, e.world.y)
			if (planet) {
				// If the viewport is already following the planet that was clicked on, then don't do anything
				var follow = viewport.plugins['follow']
				if (follow && (follow.target == planet)) {
					// Do the zoom if holding shift
					if (PIXI.keyboardManager.isDown(Key.SHIFT)) {
						viewport.snapZoom({
							height: SUN_HEIGHT,
							time: ANIMATION_TIME,
							removeOnComplete: true,
							ease: 'easeInOutSine'
						})
					} else {
						viewport.snapZoom({
							height: PLANET_HEIGHT,
							time: ANIMATION_TIME,
							removeOnComplete: true,
							ease: 'easeInOutSine'
						})
					}

					return
				}

				snappingToPlanet = planet

				// The calculated future positions of the planet
				var pos = planet.calcPosition(ANIMATION_TIME / 1000)

				// Snap to that position
				viewport.snap(pos.x, pos.y, {
					time: ANIMATION_TIME,
					removeOnComplete: true,
					ease: 'easeOutQuart'
				})

				// Do the zoom if not holding shift
				if (!PIXI.keyboardManager.isDown(Key.SHIFT)) {
					viewport.snapZoom({
						height: PLANET_HEIGHT,
						time: ANIMATION_TIME,
						removeOnComplete: true,
						ease: 'easeInOutSine'
					})
				}

				return
			}

			// If nothing was clicked on, remove the follow plugin
			stopFollow()
			centerView()
		}
	}
}

//  _    _ _   _ _ 
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

function resize() {
	window.scrollTo(0, 0)

	var oldCenter
	if (viewport.center) {
		oldCenter = viewport.center
	}

	var prevHeight = viewport.worldScreenHeight

	var width = window.innerWidth
	var height = window.innerHeight
	var ratio = height / INIT_HEIGHT

	pixigame.renderer.resize(width, height)
	viewport.resize(width, height, width, height)
	viewport.fitHeight(prevHeight, false)

	// Must maintain the center manually instad of using fitHeight's built in one because the
	// center value will change upon resizing the viewport and game window
	if (oldCenter) {
		viewport.moveCenter(oldCenter)
	}

	stopSnap()
	menu.resize()
}

//   _____                      
//  / ____|                     
// | |  __  __ _ _ __ ___   ___ 
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

var allowMouseClick = true
var focusPlanet
var lastElapsed

function gameLoop() {
	{ // Updates Keyboard
		if (PIXI.keyboardManager.isPressed(Key.ESCAPE) || PIXI.keyboardManager.isPressed(Key.A) || PIXI.keyboardManager.isPressed(Key.D) || PIXI.keyboardManager.isPressed(Key.SPACE)) {

			if (isChoosingShipSend()) {
				cancelSendShips()
			} else {
				centerView()
			}
		}

		PIXI.keyboardManager.update()
	}

	let now = Date.now()
	let elapsed = now - lastElapsed
	lastElapsed = now
	let eTime = (elapsed * 0.001) // time elapsed in seconds

	if (game) game.update(eTime)
}
