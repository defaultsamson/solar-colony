# space-territory
Another space game (very different from the first)

## To Build game.js

### 1. Setup Browserify
```
npm i -g browserify
```

### 2. Install required modules
```
npm i pixi.js pixi-viewport pixi-keyboard pixi-particles
```

### (Optional) 3. Build Libraries
```
build_libraries.bat
-- or --
build_libraries.sh
```

The build process builds `./libraries.js` to `./game/lib/libraries.js` using Browserify
