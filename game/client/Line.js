class Line extends PIXI.Graphics {
    constructor(lineSize, lineColor) {
        super()

        this.l_width = lineSize || 5
        this.l_colour = lineColor || "0xFFFFFF"
    }

    setPoints(x1, y1, x2, y2) {
        this.clear()
        this.lineStyle(this.l_width, this.l_colour)

        this.moveTo(x1, y1)
        this.lineTo(x2, y2)
    }
}
