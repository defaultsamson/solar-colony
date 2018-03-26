function average(data) {
    var sum = data.reduce(function (sum, value) {
        return sum + value
    }, 0)

    var avg = sum / data.length
    return avg
}

function median(args) {
    var numbers = args.slice(0).sort((a, b) => a - b)
    var middle = Math.floor(numbers.length / 2)
    var isEven = numbers.length % 2 === 0
    return isEven ? (numbers[middle] + numbers[middle - 1]) / 2 : numbers[middle]
}

function std(values, avg) {
    return Math.sqrt(median(values.map(function (value) {
        var diff = value - avg
        return diff * diff
    })))
}

// Based on
// http://www.mine-control.com/zack/timesync/timesync.html
/*

    1. server stamps current local time on a "time request" packet and sends to client
    2. Upon receipt by client, client stamps client-time and returns
    3. Upon receipt by server, server subtracts current time from sent time and divides by two to compute latency. It subtracts current time from client time to determine server-client time delta and adds in the half-latency to get the correct clock delta.
    (So far this algothim is very similar to SNTP)
    4. The first result should immediately be used to update the clock since it will get the local clock into at least the right ballpark (at least the right timezone!)
    5. The server repeats steps 1 through 3 five or more times, pausing a few seconds each time. Other traffic may be allowed in the interim, but should be minimized for best results
    6. The results of the packet receipts are accumulated and sorted in lowest-latency to highest-latency order. The median latency is determined by picking the mid-point sample from this ordered list.
    7. All samples above approximately 1 standard-deviation from the median are discarded and the remaining samples are averaged using an arithmetic mean.*/

const skewThreshold = 5 // quantity of pings until performing skew algorithm
const pingDelay = 500 // minimum time inbetween pings
const connectionTimeout = 20000

class Timeskewer extends Object {
    constructor(sock) {
        super()

        this.sock = sock
        this.timeWaited = 0
        this.sent = false
        this.pings = []
        this.initialPings = true
        this.ping = 200 // a good initial estimate
    }

    update(delta) {
        this.timeWaited += delta * 1000

        // if it's past the minimum time to ping
        if (this.timeWaited >= pingDelay) {
            // and it hasn't already sent the ping packet
            if (!this.sent) {
                this.sendTimePack()
                // Else if it's sent the ping packet and still waiting...
            } else if (this.timeWaited >= connectionTimeout) {
                // They timed out, close the connection
                this.sock.close()
            }
        }
    }

    sendTimePack() {
        this.timeWaited = 0
        this.sent = true
        //1. 
        this.time = Date.now()

        let pack = {
            type: Pack.PING_PROBE
        }
        this.sock.send(JSON.stringify(pack))
    }

    recieve() {
        this.sent = false
        // 3.
        let ping = (Date.now() - this.time) / 2
        // Add the new ping to the beginning of the pings list
        this.pings.unshift(ping)

        // if the server still doesn't have enough data to perform the algorithm on
        if (this.initialPings) {
            this.ping = ping

            let pack = {
                type: Pack.PING_SET,
                ping: Math.ceil(this.ping)
            }
            this.sock.send(JSON.stringify(pack))
        }

        // If the pings should now be skewed
        if (this.pings.length >= skewThreshold) {
            this.initialPings = false
            let median = average(this.pings)
            let sd = std(this.pings, median)

            for (var i = this.pings.length - 1; i >= 0; i--) {
                if (Math.abs(this.pings[i] - median) > sd) {
                    this.pings.splice(i, 1)
                }
            }

            this.ping = average(this.pings)
            this.pings = []

            let pack = {
                type: Pack.PING_SET,
                ping: Math.ceil(this.ping)
            }
            this.sock.send(JSON.stringify(pack))
        }
    }
}

module.exports = Timeskewer
