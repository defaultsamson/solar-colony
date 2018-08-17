npm i -g browserify # Update browserify
npm i ws fs express node-gameloop # Update server libraries
npm i pixi.js pixi-viewport pixi-keyboard pixi-particles # Update client libraries
browserify libraries.js -o ./game/client/libraries.js # Compile using browserify
