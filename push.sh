#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage: $0 <web|live|help>"
	exit 1
fi

if [ $1 = "web" ]; then
	echo "Pushing to main website"
	scp -r ./game ./index.html samson@samsonclose.me:/var/www/html/prototype/solar
	scp -r ./game/server ./game/shared samson@samsonclose.me:/home/samson/servers/solar
	ssh root@samsonclose.me 'systemctl restart solar'
elif [ $1 = "live" ]; then
	echo "Starting live preview with browser-sync. Connect with one of the following addresses"
	ip addr show | grep --only-matching "[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}"
	node ./game/server/Server.js & browser-sync start --server
elif [ $1 = "help" ]; then
	echo "Usage: $0 <web|live|help>"
	exit 1
fi

