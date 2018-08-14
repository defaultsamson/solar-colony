#!/bin/bash

if [ $1 -eq 1 ]; then
	if [ -f temp1.js ]; then
		rm temp1.js
	fi

	ORDER="./libraries.js ./game/shared/Constants.js ./game/shared/Util.js ./game/shared/Orbit.js ./game/shared/Planet.js ./game/shared/Ship.js ./game/shared/System.js ./game/shared/Team.js ./game/client/Hud.js ./game/client/Line.js ./game/client/Menu.js ./game/client/Player.js ./game/client/SocketManager.js ./game/client/Client.js"

	for f in $ORDER; do (cat "${f}"; echo) >> temp1.js; done

	browserify temp1.js -o temp.js

	rm temp1.js
elif [ $1 -eq 2 ]; then
	#uglifyjs temp.js temp.js -o compiled.js
	java -jar closure-compiler-v20180805.jar --js temp.js --js_output_file compiled.js
elif [ $1 -eq 3 ]; then
	rm temp.js
fi
