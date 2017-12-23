const localDebug = true

const port = 3141

const WebSocket = require('ws');
const express = require('express')
const https = require('https')
const fs = require('fs')

var Game = require('./Game.js')
require('./ServerObj.js')

class SocketManager extends Object {
    constructor(serverObj) {
        super()

        this.server = serverObj
        this.connections = []
    }

    connect() {
        if (localDebug) {
            this.wss = new WebSocket.Server({
                port: port
            })
        } else {
            // This line is from the Node.js HTTPS documentation.
            var options = {
                key: fs.readFileSync('/ssl/www_samsonclose_me.key'),
                cert: fs.readFileSync('/ssl/www_samsonclose_me.crt')
            }

            // Create a service (the app object is just a callback).
            var app = express()

            // Create an HTTPS service 
            var httpsServer = https.createServer(options, app).listen(port)

            this.wss = new WebSocket.Server({
                server: httpsServer
            })
        }

        let sm = this

        this.wss.on('connection', function connection(ws) {
            ws.on('open', function open() {
                //ws.send('opened');
            })

            ws.on('close', function close() {
                // Remove the connection
                sm.removeConnection(ws)
            })

            ws.on('message', function incoming(msg) {
                try {
                    var pack = JSON.parse(msg)
                    sm.server.parse(ws, pack.type, pack)
                } catch (err) {
                    console.log(err)
                }
            })
        })
    }

    removeConnection(sock) {
        var i = this.connections.indexOf(sock)
        if (i != -1) {
            this.connections.splice(i, 1)
        }
    }

    addConnection(sock, host, name, id) {
        if (!this.approved(sock)) {
            id = id ? id.toUpperCase() : ''

            // Test if the name is proper
            if (/^([A-Za-z0-9]{3,20})$/.test(name)) {
                // Test if no ID was given
                if (id == '') {
                    this.connections.push(sock)

                    console.log('host: ' + host)

                    if (host) {
                        var formPacket = {
                            type: 'formpass'
                        }
                        sock.send(JSON.stringify(formPacket))
                        console.log('hosting')

                        // Create a game with an ID
                        var id = generateSafeID()

                        var game = new Game(id)
                        games.push(game)

                        game.addPlayer(sock)

                    } else {
                        var formPacket = {
                            type: 'formpass'
                        }
                        sock.send(JSON.stringify(formPacket))
                        console.log('randomassgame')
                        // Join a random game
                        this.queue(sock)
                    }

                    // If ID was given make sure it's proper
                } else if (/^([A-Z0-9]{6})$/.test(id)) {
                    let game = this.server.findGame(id)

                    if (game) {
                        var formPacket = {
                            type: 'formpass'
                        }
                        sock.send(JSON.stringify(formPacket))

                        game.addPlayer(sock)

                    } else {
                        // No game found with given ID
                        var formPacket = {
                            type: 'formfail',
                            reason: 'No existing game with ID ' + id
                        }
                        sock.send(JSON.stringify(formPacket))
                    }
                } else {
                    // Improper ID
                    var formPacket = {
                        type: 'formfail',
                        reason: 'Improper game ID provided'
                    }
                    sock.send(JSON.stringify(formPacket))
                }
            } else {
                // Improper name
                var formPacket = {
                    type: 'formfail',
                    reason: 'Improper username provided'
                }
                sock.send(JSON.stringify(formPacket))
            }
        }
    }

    queue(socket) {
        if (this.inline) {
            createSystem(this.inline, socket)
            this.inline = null
        } else {
            this.inline = socket;
        }
    }

    approved(con) {
        // Check if con is in this.connections
        for (var i in this.connections) {
            if (this.connections[i] === con) return true
        }
        return false
    }
}

module.exports = SocketManager

