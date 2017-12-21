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

        this.serverObj = serverObj
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

        var server = this.serverObj

        this.wss.on('connection', function connection(ws) {
            ws.on('open', function open() {
                //ws.send('opened');
            })

            ws.on('close', function close() {
                // Remove the connection from this.conenctions
                var i = this.connections.indexOf(ws)
                if (i != -1) {
                    this.connections.splice(i, 1)
                }
            })

            ws.on('message', function incoming(msg) {
                try {
                    var pack = JSON.parse(msg)
                    server.parse(ws, pack.type, pack)
                } catch (err) {
                    console.log(err)
                }
            })
        })
    }

    addConnection(sock, host, name, id) {
        if (!this.approved(sock)) {
            host = host ? true : false
            if (id) id = id.toUpperCase()

            // Test if the name is proper
            if (/^([A-Za-z0-9]{3,20})$/.test(name)) {
                // Test if no ID was given
                if (!id) {
                    this.connections.push(sock)

                    if (host) {
                        // Create a game with an ID
                        var id = generateSafeID()

                        games.push(new Game(id))

                        game.addPlayer(sock)

                    } else {
                        // Join a random game
                        this.queue(sock)
                    }

                    // If ID was given make sure it's proper
                } else if (/^([A-Z0-9]{6})$/.test(id)) {
                    let game = findGame(id)

                    if (game) {
                        game.addPlayer(sock)
                    }

                } else {
                    // Improper ID
                    var formPacket = {
                        type: 'formfail',
                        reason: 'Improper game ID provided'
                    }
                    sock.send(JSON.stringify(formpacket))
                }
            } else {
                // Improper name
                var formPacket = {
                    type: 'formfail',
                    reason: 'Improper username provided'
                }
                sock.send(JSON.stringify(formpacket))
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


const idChars = 'ABCDEFGHJKMNOPQRSTUVWXYZ23456789'

// Generates an ID that no other game currently has
function generateSafeID() {
    var id
    while (true) {
        var badID = false
        id = generateID()
        for (var i in systems) {
            if (systems.id == id) {
                badID = true
                break
            }
        }
        if (!badID) {
            return id
        }
    }
}

// Generates a random game ID
function generateID() {
    var id = ''
    for (var i = 0; i < idLength; i++) {
        id += idChars.charAt(Math.floor(Math.random() * idChars.length))
    }
    return id
}
