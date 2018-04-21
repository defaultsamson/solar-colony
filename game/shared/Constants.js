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
const JOIN_GAME_BUTTON = 'b_join'
const CREATE_GAME_BUTTON = 'b_create'
const RANDOM_GAME_BUTTON = 'b_random'
const WITH_FRIENDS_BUTTON = 'b_friends'
const USERNAME_TEXT = 't_user'
const ID_TEXT = 't_id'
const PLAYER_COUNT_TEXT = 't_playerCount'
const PLAYERS_BUTTON_2 = 'b_p2'
const PLAYERS_BUTTON_3 = 'b_p3'
const PLAYERS_BUTTON_4 = 'b_p4'
const PLAYERS_BUTTON_8 = 'b_p8'
const PLAYERS_BUTTON_16 = 'b_p16'
const PLAYERS_BUTTON_RANDOM = 'b_pRnd'
const START_BUTTON = 'b_start'
const USERNAME_INPUT = 'i_user'
const ID_INPUT = 'i_id'
const USERNAME_CHECK = 'p_userG'
const USERNAME_CROSS = 'p_userB'
const ID_CHECK = 'p_idG'
const ID_CROSS = 'p_idB'

const CONNECTION_TEXT = 't_connecting'
const MESSAGE_TEXT = 't_message'
