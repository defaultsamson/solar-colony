# Solar Colony
A multiplayer team-based space colonisation game. https://samsonclose.me/space/

## To Build ./game/client/lib/libraries.js

This process builds `./libraries.js` to `./game/client/libraries.js` using the tool Browserify

### 1. Setup Browserify
```
npm i -g browserify
```

### 2. Install required modules
```
npm i pixi.js pixi-viewport pixi-keyboard pixi-particles
```

### 3. Build Libraries
```
build_libraries.bat
-- or --
build_libraries.sh
```

## Server

### 1. Install required modules
```
npm i ws fs express node-gameloop
```

### 2. Modify ./game/server/Server.js  
Change the file paths of the secure websocket's `key` and `cert` to point to your SSL certificates.

### 3. Run server
```
node Server.js
```
