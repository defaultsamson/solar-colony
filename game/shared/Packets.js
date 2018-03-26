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
    FORM_SEND: 21
}

if (isServer) {
    global.Pack = Pack
}
