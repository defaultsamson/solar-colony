let ip = LOCAL_DEBUG ? 'localhost' : 'samsonclose.me'

class SocketManager extends Object {
	constructor() {
		super()

		this.ws = null
	}

	connect(secure) {
		secure = exists(secure) ? secure : !LOCAL_DEBUG

		if (secure) {
			this.ws = new WebSocket('wss://' + ip + ':' + PORT)
		} else {
			this.ws = new WebSocket('ws://' + ip + ':' + PORT)
		}

		return this.ws
	}

	parse(type, packet) {

	}
}
