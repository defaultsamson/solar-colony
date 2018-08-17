#!/bin/bash

TEMP="temp.js"
COMPILED="compiled.js"
COMPILER="closure-compiler-v20180805.jar"

# Whenever a new file is added to the game, it must also be added here
ORDER="./libraries.js ./game/client/PreClient.js ./game/shared/Constants.js ./game/shared/Util.js ./game/shared/Orbit.js ./game/shared/Planet.js ./game/shared/Ship.js ./game/shared/System.js ./game/shared/Team.js ./game/shared/Game.js ./game/client/Line.js ./game/client/Menu.js ./game/client/Player.js ./game/client/SocketManager.js ./game/client/Client.js"

if [ $# -ge 1 ]; then
	if [[ $1 = "clean" ]]; then
		echo "Creating clean"
		rm -f $TEMP $COMPILED
	elif [[ $1 = "help" ]]; then
		echo "Usage: ./compile.sh [clean]"
		exit 0
	fi
fi

# Create the temp.js file if neccessary
if [ ! -f $TEMP ]; then
	echo "Creating new $TEMP..."

	# Concatenates the files with a new line between each one
	echo "Concatenating..."
	for f in $ORDER; do (cat "${f}"; echo) >> $TEMP; done

	echo "Browserifying..."
	browserify $TEMP -o $TEMP
	echo "Successfully created $TEMP"
fi

#uglifyjs temp.js temp.js -o compiled.js
echo "Compiling..."
java -jar $COMPILER --js $TEMP --js_output_file $COMPILED --compilation_level SIMPLE --warning_level QUIET
RE=$?
if [ $RE -eq 0 ]; then
	echo "Successfully compiled to $COMPILED"
else
	echo ""
	echo "Please manually fix the above $RE error(s) in $TEMP and run $0"
	exit $RE
fi
