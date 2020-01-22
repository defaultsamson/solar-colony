const WebSocket = require('ws')
const express = require('express')
const https = require('https')
const fs = require('fs')

const uuidv4 = require('uuid/v4')

class SocketManager extends Object {
  constructor (gameManager) {
    super()

    this.gm = gameManager
    // this.connections = []
    this.abandonedSessions = []
  }

  connect () {
    if (LOCAL_DEBUG) {
      this.wss = new WebSocket.Server({
        port: PORT
      })
    } else {
      // This line is from the Node.js HTTPS documentation.
      let options = {
        key: fs.readFileSync('/ssl/private.key'),
        cert: fs.readFileSync('/ssl/public.crt')
      }

      // Create a service (the app object is just a callback).
      let app = express()

      // Create an HTTPS service
      let httpsServer = https.createServer(options, app).listen(PORT)

      this.wss = new WebSocket.Server({
        server: httpsServer
      })
    }

    let sm = this

    this.wss.on('connection', function connection (ws) {
      ws.on('open', function open () {
        // ws.send('opened');
      })

      ws.on('close', function close () {
        // Remove the connection
        try {
          sm.removeSession(ws)
        } catch (err) {
          console.log(err)
        }
      })

      ws.on('error', function error (e) {
        // Remove the connection
        try {
          console.log('Error: ' + e.code)
          sm.removeSession(ws)
        } catch (err) {
          console.log(err)
        }
      })

      ws.on('message', function incoming (msg) {
        try {
          let pack = JSON.parse(msg)
          sm.parse(ws, pack.type, pack)
        } catch (err) {
          console.log(err)
        }
      })
    })
  }

  parse (sock, type, pack) {
    switch (type) {
      case Pack.PING_PROBE:
        if (sock.pinger) {
          sock.pinger.recieve()
        }
        break
      case Pack.SESSION: {
        if (exists(pack.sessID)) {
          // Try to resume previous session
          for (let i in this.abandonedSessions) {
            if (exists(this.abandonedSessions[i]) && this.abandonedSessions[i].sessID === pack.sessID) {
              // The player and this abandoned session have the same UUID. Hook 'em up again
              let sess = this.abandonedSessions[i]
              this.abandonedSessions.splice(i, 1) // Remove the session
              this.startSession(sock, sess)
              return
            }
          }
        }

        // Create new session if nothing could be done earlier
        let sess = {
          sessID: uuidv4()
        }

        this.startSession(sock, sess)
      }
        break
      case Pack.FORM: {
        let name = pack.name
        let host = pack.host
        let gameID = pack.gameID ? pack.gameID.toUpperCase() : ''

        sock.sess.name = name
        sock.sess.host = host

        if (USERNAME_REGEX.test(name)) {
        // Test if no ID was given
          if (gameID === '') {
            if (host) {
              // Create new game and add a player to it
              let game = this.gm.createGame()
              game.addPlayer(sock)
            } else {
              // Join a random game
              this.gm.queue(sock)
            }

            // If ID was given make sure it's proper
          } else if (ID_REGEX.test(gameID)) {
            let game = this.gm.findGame(gameID)

            if (game) {
              game.addPlayer(sock)
            } else {
              // No game found with given ID
              let formPacket = {
                type: Pack.FORM,
                reason: 'No existing game with ID ' + gameID
              }
              sock.send(JSON.stringify(formPacket))
            }
          } else {
            // Improper ID
            let formPacket = {
              type: Pack.FORM,
              reason: 'Improper game ID provided'
            }
            sock.send(JSON.stringify(formPacket))
          }
        } else {
          sock.send(JSON.stringify({
            type: Pack.FORM,
            reason: 'Improper username provided'
          }))
        }
        break
      }
      default:
        if (this.approved(sock) && sock.game) {
          sock.game.parse(sock, type, pack)
        }
        break
    }
  }

  removeSession (sock) {
    /*
    let i = this.connections.indexOf(sock)
    if (i != -1) {
      this.connections.splice(i, 1)
    }
    */

    this.abandonedSessions.push(sock.sess)

    if (sock.game) {
      sock.game.removePlayer(sock)
    }
  }

  startSession (sock, sess) {
    sock.sess = sess

    let game = this.gm.findGame(sess.gameID)

    sock.send(JSON.stringify({
      type: Pack.SESSION,
      sessID: sess.sessID,
      hasGame: exists(game)
    }))

    if (exists(game)) {
      game.addPlayer(sock)
    } else {
      sock.sess.gameID = null
      sock.sess.teamID = null
    }
  }

  approved (sock) {
    return sock.approved === true
  }
}

module.exports = SocketManager
