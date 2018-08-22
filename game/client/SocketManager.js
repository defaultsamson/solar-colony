var ip
if (LOCAL_DEBUG) {
	try {
		// Gets the IP from the browser (makes LAN connections for phones, laptops etc easier)
		ip = location.host.split(':')[0]
	} catch (err) {
		ip = 'localhost'
	}
} else {
	ip = 'samsonclose.me'
}


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
