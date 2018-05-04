class Orbit extends(isServer ? Object : PIXI.Graphics) {
	constructor(x, y, radius) {
		super()

		this.x = x
		this.y = y
		this.radius = radius

		if (!isServer) {
			var numOfDashes = Math.max(Math.floor(Math.PI * radius / DASH_LENGTH), MIN_DASHES)
			var dashRadians = DASH_LENGTH / radius
			var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

			// If it's a full circle, draw it full (more optimised)
			if (spacingRadians <= 0) {
				this.lineStyle(DASH_THICKNESS, Colour.dashedLine) //(thickness, color)
				this.arc(x, y, radius, 0, 2 * Math.PI)
			} else { // Else, draw it dashed
				for (var i = 0; i < numOfDashes; i++) {
					var start = i * (dashRadians + spacingRadians)
					var end1 = start + dashRadians
					var end2 = end1 + spacingRadians
					this.lineStyle(DASH_THICKNESS, Colour.dashedLine) //(thickness, color)
					this.arc(x, y, radius, start, end1)
					this.lineStyle(DASH_THICKNESS, Colour.background, 0)
					this.arc(x, y, radius, end1, end2)
				}
			}

			// disgusting
			// this.cacheAsBitmap = true
		}
	}
}

if (isServer) {
	module.exports = Orbit
}
