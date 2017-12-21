const ip = 'localhost' //'samsonclose.me'
const port = 3141

class SocketManager extends Object {
    constructor() {
        super()
    }

    connect(secure) {
        secure = exists(secure) ? secure : ip != 'localhost'

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
