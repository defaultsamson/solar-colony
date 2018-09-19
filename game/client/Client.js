//   _____      _
//  / ____|    | |
// | (___   ___| |_ _   _ _ __
//  \___ \ / _ \ __| | | | '_ \
//  ____) |  __/ |_| |_| | |_) |
// |_____/ \___|\__|\__,_| .__/
//                       | |
//                       |_|

let game
let pixigame
let menu
let socket
let viewport
let resources

window.onload = function () {
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
    worldWidth: INIT_WIDTHgithub,
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

  viewport.on('drag-start', (e) => {
    stopViewport()
  })
  viewport.on('pinch-start', stopViewport)
  viewport.on('wheel', () => { stopViewport(false) })
  viewport.on('clicked', (e) => {
    if (game) {
      game.onMouseClick(e)
    }
  })

  // Upon ending of the snap, if it was just snapping to a planet, begin to follow it
  viewport.on('snap-end', () => {
    stopViewport(false)
    if (focusPlanet) {
      viewport.follow(focusPlanet)
    }
  })

  viewport.fitHeight(SUN_HEIGHT)
  viewport.moveCenter(0, 0)

  window.lastElapsed = Date.now()
  pixigame.ticker.add(() => {
    if (game) {
      let now = Date.now()
      let elapsed = now - lastElapsed
      lastElapsed = now
      game.update(elapsed * 0.001) // time elapsed in seconds
    }
  })

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

let snappingToCenter = false

function stopViewport (removeFocus) {
  snappingToCenter = false
  viewport.removePlugin('snap')
  viewport.removePlugin('snap-zoom')
  if (!exists(removeFocus) || removeFocus) {
    focusPlanet = null
    viewport.removePlugin('follow')
  }
}

function centerView () {
  if (!snappingToCenter) {
    stopViewport()
    snappingToCenter = true
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

//  _    _ _   _ _
// | |  | | | (_) |
// | |  | | |_ _| |
// | |  | | __| | |
// | |__| | |_| | |
//  \____/ \__|_|_|

function resize () {
  window.scrollTo(0, 0)

  let oldCenter
  if (viewport.center) {
    oldCenter = viewport.center
  }

  let prevHeight = viewport.worldScreenHeight

  let width = window.innerWidth
  let height = window.innerHeight
  let ratio = height / INIT_HEIGHT

  pixigame.renderer.resize(width, height)
  viewport.resize(width, height, width, height)
  viewport.fitHeight(prevHeight, false)

  // Must maintain the center manually instad of using fitHeight's built in one because the
  // center value will change upon resizing the viewport and game window
  if (oldCenter) {
    viewport.moveCenter(oldCenter)
  }

  stopViewport(false)
  menu.resize()
}

//   _____
//  / ____|
// | |  __  __ _ _ __ ___   ___
// | | |_ |/ _` | '_ ` _ \ / _ \
// | |__| | (_| | | | | | |  __/
//  \_____|\__,_|_| |_| |_|\___|

let focusPlanet
