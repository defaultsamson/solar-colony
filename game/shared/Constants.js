//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

const LOCAL_DEBUG = false
const PORT = 3141

const Pack = {
	CREATE_SPAWN: 0,
	BUY_SHIPS: 1,
	PING_PROBE: 2, // Tells the client to respond with this packet
	PING_SET: 3, // Tells the client what their ping is
	UPDATE_PIXELS: 4,
	FORM_FAIL: 5,
	CREATE_SYSTEM: 6,
	CREATE_ORBIT: 7,
	CREATE_PLANET: 8,
	SET_PLANET_ORBIT: 9,
	CREATE_TEAMS: 10,
	SET_PLANET_TEAM: 11,
	SET_CLIENT_TEAM: 12,
	START_GAME: 13,
	START_BUTTON: 14,
	POPULATE_TEAM: 15,
	CLEAR_TEAMS: 16,
	CLEAR_TEAM_GUI: 17,
	JOIN_GAME: 18,
	JOIN_TEAM: 19,
	QUIT: 20,
	FORM_SEND: 21,
	SHOW_SYSTEM: 22,
	UPDATE_TEAMS: 23,
	UPDATE_MESSAGE: 24
}

// Note: make sure that GAME_COUNTDOWN_TIME is divisible by PACKET_INTERVAL
const COUNTDOWN_TIME = 6000 // 3 second countdown
const COUNTDOWN_INTERVAL = 250 // interval between packets send to client
const COUNTDOWN_PACKET_SENDS = COUNTDOWN_TIME / COUNTDOWN_INTERVAL

const Colour = {
	BACKGROUND: 0x2A2C31,
	DASHED_LINE: 0x484B51,

	DARK1: 0x1E2124,
	DARK2: 0x2A2C31,
	DARK3: 0x2F3136,
	DARK4: 0x32343A,
	DARK5: 0x36393E,
	DARK6: 0x484B51,
	DARK7: 0x6C6D70,
	DARK8: 0x7E8084,
	DARK9: 0xA9AAAC,
	WHITE: 0xFFFFFF,

	GREY_TEXT: '#888',

	RED: 0xFF8888,
	ORANGE: 0xFFBB4A,
	YELLOW: 0xFFFF66,
	GREEN: 0xAAFFAA,
	BLUE: 0x7799FF,
	PURPLE: 0xBB88DD
}

//   _____                          
//  / ____|                         
// | (___   ___ _ ____   _____ _ __ 
//  \___ \ / _ \ '__\ \ / / _ \ '__|
//  ____) |  __/ |   \ V /  __/ |   
// |_____/ \___|_|    \_/ \___|_|   

const MIN_PLAYERS = 2 // minimum players required to start a game

if (isServer) {
	global.LOCAL_DEBUG = LOCAL_DEBUG
	global.PORT = PORT

	global.Pack = Pack

	global.COUNTDOWN_TIME = COUNTDOWN_TIME
	global.COUNTDOWN_INTERVAL = COUNTDOWN_INTERVAL
	global.COUNTDOWN_PACKET_SENDS = COUNTDOWN_PACKET_SENDS

	global.MIN_PLAYERS = MIN_PLAYERS

	global.Colour = Colour
}

//   _____ _ _            _   
//  / ____| (_)          | |  
// | |    | |_  ___ _ __ | |_ 
// | |    | | |/ _ \ '_ \| __|
// | |____| | |  __/ | | | |_ 
//  \_____|_|_|\___|_| |_|\__|

// The extra pixels to add to the radius of a planet to determine whether it was clicked
const PLANET_CLICK_RADIUS = 40

// The animation time (in milliseconds) for zooming, panning, etc.
const ANIMATION_TIME = 300
// The height of the viewport after zooming on a planet
const PLANET_HEIGHT = 250
// The height of the viewport after zooming back out to the sun
const SUN_HEIGHT = 800

// Viewport constants
const MAX_HEIGHT = 1000
const MIN_HEIGHT = 100

// The required minimum amount of dashes to draw
const MIN_DASHES = 2
// The thickness of the dashes being drawn
const DASH_THICKNESS = 1.4
// The length of the dashes being drawn
const DASH_LENGTH = 25

// The HTML id's of the elements
// const ALL_ELEMS = []

const INPUT_DIV = 'input'

const Elem = {
	Button: {
		JOIN: 'b_join',
		CREATE: 'b_create',
		RANDOM: 'b_random',
		WITH_FRIENDS: 'b_friends',

		PLAYERS_2: 'b_p2',
		PLAYERS_3: 'b_p3',
		PLAYERS_4: 'b_p4',
		PLAYERS_8: 'b_p8',
		PLAYERS_16: 'b_p16',
		ANY_PLAYERS: 'b_pRnd',

		START: 'b_start',
		QUIT: 'b_quit',

		TEAM_RED: 'b_team_red',
		TEAM_ORANGE: 'b_team_orange',
		TEAM_YELLOW: 'b_team_yellow',
		TEAM_GREEN: 'b_team_green',
		TEAM_BLUE: 'b_team_blue',
		TEAM_PURPLE: 'b_team_purple'
	},

	Text: {
		ID_DISPLAY1: 't_id_display1', // Displays on team selection
		ID_DISPLAY2: 't_id_display2',
		PING: 't_ping',
		PLAYER_COUNT: 't_players',

		USERNAME: 't_user',
		ID: 't_id',

		CONNECTION_MESSAGE: 't_connecting',
		MESSAGE: 't_message'
	},

	List: {
		TEAM_RED: 'l_team_red',
		TEAM_ORANGE: 'l_team_orange',
		TEAM_YELLOW: 'l_team_yellow',
		TEAM_GREEN: 'l_team_green',
		TEAM_BLUE: 'l_team_blue',
		TEAM_PURPLE: 'l_team_purple'

	},

	Input: {
		USERNAME: 'i_user',
		ID: 'i_id'
	},

	Image: {
		USERNAME_CHECK: 'p_userG',
		USERNAME_CROSS: 'p_userB',
		ID_CHECK: 'p_idG',
		ID_CROSS: 'p_idB'
	}
}

const Key = {
	BACKSPACE: 8,
	TAB: 9,
	ENTER: 13,
	SHIFT: 16,
	PAUSE: 19,
	CTRL: 17,
	ALT: 18,
	CAPS_LOCK: 20,
	ESCAPE: 27,
	SPACE: 32,
	PAGE_UP: 33,
	PAGE_DOWN: 34,
	END: 35,
	HOME: 36,
	LEFT: 37,
	UP: 38,
	RIGHT: 39,
	DOWN: 40,
	PRINT_SCREEN: 44,
	INSERT: 45,
	DELETE: 46,
	_0: 48,
	_1: 49,
	_2: 50,
	_3: 51,
	_4: 52,
	_5: 53,
	_6: 54,
	_7: 55,
	_8: 56,
	_9: 57,
	A: 65,
	B: 66,
	C: 67,
	D: 68,
	E: 69,
	F: 70,
	G: 71,
	H: 72,
	I: 73,
	J: 74,
	K: 75,
	L: 76,
	M: 77,
	N: 78,
	O: 79,
	P: 80,
	Q: 81,
	R: 82,
	S: 83,
	T: 84,
	U: 85,
	V: 86,
	W: 87,
	X: 88,
	Y: 89,
	Z: 90,
	CMD: 91,
	CMD_RIGHT: 93,
	NUM_0: 96,
	NUM_1: 97,
	NUM_2: 98,
	NUM_3: 99,
	NUM_4: 100,
	NUM_5: 101,
	NUM_6: 102,
	NUM_7: 103,
	NUM_8: 104,
	NUM_9: 105,
	MULTIPLY: 106,
	ADD: 107,
	SUBTRACT: 109,
	DECIMAL_POINT: 110,
	DIVIDE: 111,
	F1: 112,
	F2: 113,
	F3: 114,
	F4: 115,
	F5: 116,
	F6: 117,
	F7: 118,
	F8: 119,
	F9: 120,
	F10: 121,
	F11: 122,
	F12: 123,
	NUM_LOCK: 144,
	SCROLL_LOCK: 145,
	SEMI_COLON: 186,
	EQUAL: 187,
	COMMA: 188,
	DASH: 189,
	PERIOD: 190,
	FORWARD_SLASH: 191,
	OPEN_BRACKET: 219,
	BACK_SLASH: 220,
	CLOSE_BRACKET: 221,
	SINGLE_QUOTE: 222
}

const Particle = {
	Infantry: {
		alpha: {
			start: 1,
			end: 0
		},
		scale: {
			start: 2,
			end: 1,
			minimumScaleMultiplier: 1
		},
		color: {
			start: 'ffffff',
			end: 'f0ffff'
		},
		speed: {
			start: 195,
			end: 2,
			minimumSpeedMultiplier: 1
		},
		acceleration: {
			x: 0,
			y: 0
		},
		maxSpeed: 0,
		startRotation: {
			min: 0,
			max: 360
		},
		noRotation: true,
		rotationSpeed: {
			min: 0,
			max: 0
		},
		lifetime: {
			min: 1,
			max: 1
		},
		blendMode: 'normal',
		frequency: 0.5,
		emitterLifetime: -1,
		maxParticles: 1,
		pos: {
			x: 0,
			y: 0
		},
		addAtBack: false,
		spawnType: 'point'
	},

	Sun: {
		alpha: {
			start: 0.2,
			end: 0
		},
		scale: {
			start: 1,
			end: 1,
			minimumScaleMultiplier: 1
		},
		color: {
			start: 'ffffff',
			end: 'f0ffff'
		},
		speed: {
			start: 20,
			end: 0,
			minimumSpeedMultiplier: 0.2
		},
		acceleration: {
			x: 1,
			y: 1
		},
		maxSpeed: 0,
		startRotation: {
			min: 0,
			max: 360
		},
		noRotation: true,
		rotationSpeed: {
			min: 0,
			max: 0
		},
		lifetime: {
			min: 1,
			max: 1
		},
		blendMode: 'normal',
		frequency: 0.03333,
		emitterLifetime: -1,
		maxParticles: 32,
		pos: {
			x: 0,
			y: 0
		},
		addAtBack: false,
		spawnType: 'point'
	}
}
