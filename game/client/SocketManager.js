let port = 3141
let ip = localDebug ? 'localhost' : 'samsonclose.me'

class SocketManager extends Object {
    constructor() {
        super()

        this.ws = null
    }

    connect(secure) {
        secure = exists(secure) ? secure : !localDebug

        if (secure) {
            this.ws = new WebSocket('wss://' + ip + ':' + port)
        } else {
            this.ws = new WebSocket('ws://' + ip + ':' + port)
        }

        return this.ws
    }

    parse(type, packet) {

    }
}
