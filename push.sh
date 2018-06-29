#!/bin/bash

if [ $# -ne 1 ]; then
	echo "Usage: $0 <main|beta|help>"
	exit 1
fi

if [ $1 = "main" ]; then
	echo "Pushing to main website"
	sudo scp -r ./game ./index.html samson@samsonclose.me:/var/www/html/space
else if [ $1 = "beta" ]; then
	echo "Pushing to beta website"
	sudo scp -r ./game ./index.html samson@samsonclose.me:/var/www/html/space/beta
else if [ $1 = "help" ]; then
	echo "Usage: $0 <main|beta|help>"
	exit 1
fi
