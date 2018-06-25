//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

const localDebug = false

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
	CREATE_TEAM: 10,
	SET_PLANET_TEAM: 11,
	SET_CLIENT_TEAM: 12,
	START_GAME: 13,
	UPDATE_START_BUTTON: 14,
	POPULATE_TEAM: 15,
	CLEAR_TEAMS: 16,
	CLEAR_TEAM_GUI: 17,
	UPDATE_PLAYER_COUNT: 18,
	JOIN_TEAM: 19,
	QUIT: 20,
	FORM_SEND: 21,
	SHOW_SYSTEM: 22
}

// Note: make sure that GAME_COUNTDOWN_TIME is divisible by PACKET_INTERVAL
const COUNTDOWN_TIME = 6000 // 3 second countdown
const COUNTDOWN_INTERVAL = 250 // interval between packets send to client
const COUNTDOWN_PACKET_SENDS = COUNTDOWN_TIME / COUNTDOWN_INTERVAL

const Colour = {
	background: 0x2A2C31,
	dashedLine: 0x484B51,

	dark1: 0x1E2124,
	dark2: 0x2A2C31,
	dark3: 0x2F3136,
	dark4: 0x32343A,
	dark5: 0x36393E,
	dark6: 0x484B51,
	dark7: 0x6C6D70,
	dark8: 0x7E8084,
	dark9: 0xA9AAAC,
	white: 0xFFFFFF,

	greyText: '#888',

	red: 0xFF8888,
	orange: 0xFFBB4A,
	yellow: 0xFFFF66,
	green: 0xAAFFAA,
	blue: 0x7799FF,
	purple: 0xBB88DD
}

//   _____                          
//  / ____|                         
// | (___   ___ _ ____   _____ _ __ 
//  \___ \ / _ \ '__\ \ / / _ \ '__|
//  ____) |  __/ |   \ V /  __/ |   
// |_____/ \___|_|    \_/ \___|_|   

const MIN_PLAYERS = 2 // minimum players required to start a game

if (isServer) {
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
const ALL_ELEMS = []

const INPUT_DIV = 'input'

const JOIN_GAME_BUTTON = 'b_join'			;ALL_ELEMS.push(JOIN_GAME_BUTTON)
const CREATE_GAME_BUTTON = 'b_create'		;ALL_ELEMS.push(CREATE_GAME_BUTTON)
const RANDOM_GAME_BUTTON = 'b_random'		;ALL_ELEMS.push(RANDOM_GAME_BUTTON)
const WITH_FRIENDS_BUTTON = 'b_friends'		;ALL_ELEMS.push(WITH_FRIENDS_BUTTON)
const USERNAME_TEXT = 't_user'				;ALL_ELEMS.push(USERNAME_TEXT)
const ID_TEXT = 't_id'						;ALL_ELEMS.push(ID_TEXT)
const PLAYER_COUNT_TEXT = 't_playerCount'	;ALL_ELEMS.push(PLAYER_COUNT_TEXT)
const PLAYERS_BUTTON_2 = 'b_p2'				;ALL_ELEMS.push(PLAYERS_BUTTON_2)
const PLAYERS_BUTTON_3 = 'b_p3'				;ALL_ELEMS.push(PLAYERS_BUTTON_3)
const PLAYERS_BUTTON_4 = 'b_p4'				;ALL_ELEMS.push(PLAYERS_BUTTON_4)
const PLAYERS_BUTTON_8 = 'b_p8'				;ALL_ELEMS.push(PLAYERS_BUTTON_8)
const PLAYERS_BUTTON_16 = 'b_p16'			;ALL_ELEMS.push(PLAYERS_BUTTON_16)
const PLAYERS_BUTTON_RANDOM = 'b_pRnd'		;ALL_ELEMS.push(PLAYERS_BUTTON_RANDOM)
const START_BUTTON = 'b_start'				;ALL_ELEMS.push(START_BUTTON)
const QUIT_BUTTON = 'b_quit'				;ALL_ELEMS.push(QUIT_BUTTON)
const USERNAME_INPUT = 'i_user'				;ALL_ELEMS.push(USERNAME_INPUT)
const ID_INPUT = 'i_id'						;ALL_ELEMS.push(ID_INPUT)
const USERNAME_CHECK = 'p_userG'			;ALL_ELEMS.push(USERNAME_CHECK)
const USERNAME_CROSS = 'p_userB'			;ALL_ELEMS.push(USERNAME_CROSS)
const ID_CHECK = 'p_idG'					;ALL_ELEMS.push(ID_CHECK)
const ID_CROSS = 'p_idB'					;ALL_ELEMS.push(ID_CROSS)

const CONNECTION_TEXT = 't_connecting'		;ALL_ELEMS.push(CONNECTION_TEXT)
const MESSAGE_TEXT = 't_message'			;ALL_ELEMS.push(MESSAGE_TEXT)

const TEAM_RED = 'b_team_red'				;ALL_ELEMS.push(TEAM_RED)
const TEAM_ORANGE = 'b_team_orange'			;ALL_ELEMS.push(TEAM_ORANGE)
const TEAM_YELLOW = 'b_team_yellow'			;ALL_ELEMS.push(TEAM_YELLOW)
const TEAM_GREEN = 'b_team_green'			;ALL_ELEMS.push(TEAM_GREEN)
const TEAM_BLUE = 'b_team_blue'				;ALL_ELEMS.push(TEAM_BLUE)
const TEAM_PURPLE = 'b_team_purple'			;ALL_ELEMS.push(TEAM_PURPLE)

const TEAM_LIST_RED = 'l_team_red'			;ALL_ELEMS.push(TEAM_LIST_RED)
const TEAM_LIST_ORANGE = 'l_team_orange'	;ALL_ELEMS.push(TEAM_LIST_ORANGE)
const TEAM_LIST_YELLOW = 'l_team_yellow'	;ALL_ELEMS.push(TEAM_LIST_YELLOW)
const TEAM_LIST_GREEN = 'l_team_green'		;ALL_ELEMS.push(TEAM_LIST_GREEN)
const TEAM_LIST_BLUE = 'l_team_blue'		;ALL_ELEMS.push(TEAM_LIST_BLUE)
const TEAM_LIST_PURPLE = 'l_team_purple'	;ALL_ELEMS.push(TEAM_LIST_PURPLE)

const ID_DISPLAY = 't_id_display'			;ALL_ELEMS.push(ID_DISPLAY) // Displays on team selection
const PING = 't_ping' 						;ALL_ELEMS.push(PING)
const PLAYER_COUNT = 't_players' 			;ALL_ELEMS.push(PLAYER_COUNT)

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

const sunParticle = {
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

const infantryParticle = {
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
}
