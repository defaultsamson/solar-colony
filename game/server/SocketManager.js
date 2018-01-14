const localDebug = true

const port = 3141

const WebSocket = require('ws');
const express = require('express')
const https = require('https')
const fs = require('fs')

class SocketManager extends Object {
    constructor(gameManager) {
        super()

        this.server = gameManager
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
                    sock.approved = true

                    if (host) {
                        // Create new game and add a player to it
                        this.server.createGame().addPlayer(sock, name)

                    } else {
                        // Join a random game
                        this.server.queue(sock)
                    }

                    // If ID was given make sure it's proper
                } else if (/^([A-Z0-9]{6})$/.test(id)) {
                    let game = this.server.findGame(id)

                    if (game) {
                        this.connections.push(sock)
                        sock.approved = true
                        game.addPlayer(sock, name)

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

    approved(sock) {
        return sock.approved === true

        // Check if con is in this.connections
        /*for (var i in this.connections) {
            if (this.connections[i] === con) return true
        }
        return false*/
    }
}

module.exports = SocketManager
