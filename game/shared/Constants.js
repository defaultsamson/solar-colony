//   _____ _                        _ 
//  / ____| |                      | |
// | (___ | |__   __ _ _ __ ___  __| |
//  \___ \| '_ \ / _` | '__/ _ \/ _` |
//  ____) | | | | (_| | | |  __/ (_| |
// |_____/|_| |_|\__,_|_|  \___|\__,_|

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
