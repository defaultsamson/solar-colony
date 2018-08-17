# Solar Colony
A multiplayer team-based space colonisation game. https://samsonclose.me/space/

Requires [Node.JS](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)

## Contributing

When you first clone the repository, you will need to run `./update_dependencies.sh` to install the required node dependencies. This will also update the `libraries.js` via Browserify.

The `push.sh` script is mostly designed for my personal use to deploy on my website, however, you can install the [Browser Sync](https://browsersync.io/) Node.JS package and easily host a live website using `./push.sh live`. Just be sure that in `./game/shared/Constants.js` you have set `LOCAL_DEBUG = true`, otherwise the game will try to use server SSL keys.

To "compile" the JS into a minified version, execute `./compile.sh` and follow the instructions. If you're having trouble and want to start fresh, run `./compile.sh clean` to remove the temp files and start fresh. You will also need to go into `index.html` and replace all the scripts with a single script pointing to `./compiled.js`. 

## Server Setup

### 1. Install dependencies

```
npm i ws fs express node-gameloop
```

### 2. Setup SSL

Modify `./game/server/Server.js` 

Change the file paths of the secure websocket's `key` and `cert` to point to your SSL certificates.

### 3. Run server
```
node Server.js
```
For running with systemd check out the systemd section of [this](https://www.digitalocean.com/community/tutorials/how-to-deploy-node-js-applications-using-systemd-and-nginx) for help.
