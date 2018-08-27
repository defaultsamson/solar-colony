function exists(a) {
	return a !== undefined && a !== null;
}

//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

/* NOTE: Doesn't work with Browserify because it creates global and window
try {
	if (exists(global)) {
		global.IS_SERVER = true
	}
} catch (err) {
	window.IS_SERVER = false
}*/

const LOCAL_DEBUG = true
const PORT = 3141

const USERNAME_REGEX = /^([A-Za-z0-9]{3,20})$/
const ID_REGEX = /^([A-Za-z0-9]{6})$/

const Pack = {
	CREATE_SHIPS: 1,
	PING_PROBE: 2, // Tells the client to respond with this packet
	PING_SET: 3, // Tells the client what their ping is
	UPDATE_PIXELS: 4,
	FORM_FAIL: 5,
	CREATE_SYSTEM: 6,
	CREATE_TEAMS: 7,
	SET_PLANET_TEAM: 8,
	SET_CLIENT_TEAM: 9,
	START_GAME: 10,
	START_BUTTON: 11,
	JOIN_GAME: 12,
	JOIN_TEAM: 13,
	QUIT: 14,
	FORM_SEND: 15,
	UPDATE_TEAMS: 16,
	UPDATE_MESSAGE: 17,
	CREATE_SPAWN: 18,
	PAUSE: 19,
	PLAY: 20
}

const COUNTDOWN_BUFFER = 1000 // 2 second buffer (Allows for people to have max ping of 2000)
const COUNTDOWN_TIME = 4000 // 4 second countdown

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

const MAX_SPAWNS = 10 // The max number of spawns permitted per planet
const MAX_PIXEL_RATE = 10
const SPAWN_LN = Math.log(MAX_SPAWNS + 1) // value used for some math

// The extra pixels to add to the radius of a planet to determine whether it was clicked
const PLANET_SELECT_RADIUS = 40
const SUN_COLLISION_RADIUS = 30
const TICKS_PER_COLLISION_UPDATE = 10 // Ticks per collision update When drawing lines between planets

//   _____                          
//  / ____|                         
// | (___   ___ _ ____   _____ _ __ 
//  \___ \ / _ \ '__\ \ / / _ \ '__|
//  ____) |  __/ |   \ V /  __/ |   
// |_____/ \___|_|    \_/ \___|_|   

if (IS_SERVER) {
	global.exists = exists

	global.LOCAL_DEBUG = LOCAL_DEBUG
	global.PORT = PORT

	global.USERNAME_REGEX = USERNAME_REGEX
	global.ID_REGEX = ID_REGEX

	global.Pack = Pack

	global.COUNTDOWN_BUFFER = COUNTDOWN_BUFFER
	global.COUNTDOWN_TIME = COUNTDOWN_TIME

	global.Colour = Colour

	global.MAX_SPAWNS = MAX_SPAWNS
	global.MAX_PIXEL_RATE = MAX_PIXEL_RATE
	global.SPAWN_LN = SPAWN_LN

	global.PLANET_SELECT_RADIUS = PLANET_SELECT_RADIUS
	global.SUN_COLLISION_RADIUS = SUN_COLLISION_RADIUS
	global.TICKS_PER_COLLISION_UPDATE = TICKS_PER_COLLISION_UPDATE

	global.MIN_PLAYERS = 2 // minimum players required to start a game
	global.MAX_PLAYERS = 8 * 6 // 8 players per team

	global.ID_LENGTH = 6
	global.ID_CHARACTERS = 'ABCDEFGHJKMNOPQRSTUVWXYZ23456789'

	global.TICKS_PER_SECOND = 30

	global.SKEW_THRESHOLD = 5 // quantity of pings until performing skew algorithm
	global.PING_INTERVAL = 500 // minimum time inbetween pings
	global.SOCKET_TIMEOUT = 10000

	global.STARTING_PIXELS = 100
}

//   _____ _ _            _   
//  / ____| (_)          | |  
// | |    | |_  ___ _ __ | |_ 
// | |    | | |/ _ \ '_ \| __|
// | |____| | |  __/ | | | |_ 
//  \_____|_|_|\___|_| |_|\__|

// This is variable, used here to initialize things
const INIT_HEIGHT = 600
const INIT_WIDTH = 600

// The animation time (in milliseconds) for zooming, panning, etc.
const ANIMATION_TIME = 300
// The height of the viewport after zooming on a planet
const PLANET_HEIGHT = 250
// The height of the viewport after zooming back out to the sun
const SUN_HEIGHT = 800

// (Client) The max number of ships to display in storage per planet
const MAX_DISPLAY_SHIPS = 100

// Viewport constants
const MAX_HEIGHT = 1000
const MIN_HEIGHT = 100

// The required minimum amount of dashes to draw
const MIN_DASHES = 2
// The thickness of the dashes being drawn
const DASH_THICKNESS = 1.4
// The length of the dashes being drawn
const DASH_LENGTH = 25

const INPUT_WIDTH = 500
const INPUT_HEIGHT = 500
const DESKTOP_SCALE = 0.75

const ACCEPTABLE_REGEX = /^([A-Za-z0-9])$/

const INPUT_DIV = 'input'
const TOP_DIV = 'top_display'
// The HTML id's of the elements
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
		TEAM_PURPLE: 'b_team_purple',

		BUY_SPAWN: 'b_buy_spawn',
		BUY_SHIPS_1000: 'b_buy_1000ships',
		BUY_SHIPS_100: 'b_buy_100ships',
		BUY_SHIPS_10: 'b_buy_10ships'
	},

	Text: {
		ID_DISPLAY1: 't_id_display1', // Displays on team selection
		ID_DISPLAY2: 't_id_display2',
		PLAYER_COUNT: 't_players_display',
		PING: 't_ping',
		PIXELS: 't_pixels',
		SHIPS: 't_ships',
		PLANET_TEXT: 't_plantext',
		PLANET_SHIPS: 't_planships',

		USERNAME: 't_user',
		ID: 't_id',
		PLAYERS: 't_players',

		CONNECTION_MESSAGE: 't_connecting',
		MESSAGE: 't_message',

		COUNTDOWN: 't_countdown'
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

var IS_MOBILE
if (!IS_SERVER) {
	IS_MOBILE = (function(a) { return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)) })(navigator.userAgent || navigator.vendor || window.opera)
}
