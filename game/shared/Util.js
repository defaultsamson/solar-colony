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
        require('../server/Util.js')
    }
} catch (err) {
    window.isServer = false
}

if (isServer) {
    global.distSqr = distSqr
    global.exists = exists
    global.isBetween = isBetween
}
