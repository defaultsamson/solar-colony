class Orbit extends(isServer ? Object : PIXI.Graphics) {
    constructor(x, y, radius, dashLength) {
        super()

        this.radius = radius

        if (!isServer) {
            var numOfDashes = Math.max(Math.floor(Math.PI * radius / dashLength), minDashes)
            var dashRadians = dashLength / radius
            var spacingRadians = (2 * Math.PI / numOfDashes) - dashRadians

            // If it's a full circle, draw it full (more optimised)
            if (spacingRadians <= 0) {
                this.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
                this.arc(x, y, radius, 0, 2 * Math.PI)
            } else { // Else, draw it dashed
                for (var i = 0; i < numOfDashes; i++) {
                    var start = i * (dashRadians + spacingRadians)
                    var end1 = start + dashRadians
                    var end2 = end1 + spacingRadians
                    this.lineStyle(dashThickness, Colour.dashedLine) //(thickness, color)
                    this.arc(x, y, radius, start, end1)
                    this.lineStyle(dashThickness, Colour.background, 0)
                    this.arc(x, y, radius, end1, end2)
                }
            }

            // disgusting
            // this.cacheAsBitmap = true
        }
    }
}
