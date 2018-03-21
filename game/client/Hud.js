const hudMargin = 20

class Hud extends PIXI.Container {
    constructor() {
        super()
    }

    updateText() {
        // If the number of pixels has been updated
        buy1ShipText.tint = myTeam.pixels < 10 ? Colour.greyText : Colour.white
        buy10ShipText.tint = myTeam.pixels < 90 ? Colour.greyText : Colour.white
        buy100ShipText.tint = myTeam.pixels < 800 ? Colour.greyText : Colour.white

        if (focusPlanet && focusPlanet.spawnCount() >= maxSpawns) {
            buySpawnText.text = 'MAX SPAWNS'
        } else {
            buySpawnText.text = '1 Spawn (1000 pixels)'
        }

        buySpawnText.tint = myTeam.pixels < 1000 || (focusPlanet && focusPlanet.spawnCount() >= maxSpawns) ? Colour.greyText : Colour.white

        sendShipText.tint = ships < 100 ? Colour.greyText : Colour.white

        hud.resize()
    }

    hideAll() {
        for (var i in this.children) {
            this.children[i].visible = false
        }
    }

    resize(width, height) {
        if (!exists(width)) {
            width = window.innerWidth
            height = window.innerHeight
        }

        // Updates all the hud components based on the new screen width and height
        for (var i in this.children) {
            if (this.children[i].updatePos) {
                this.children[i].updatePos(width, height)
            }
        }
    }
}

class TextButton extends PIXI.Text {
    constructor(text, style, screenWidthProp, screenHeightProp, constantX, constantY, relativeTo, relativeToWidthProp, relativeToHeightProp) {
        super(text, style)

        this.screenWidthProp = screenWidthProp
        this.screenHeightProp = screenHeightProp
        this.constantX = constantX
        this.constantY = constantY
        this.relativeTo = relativeTo
        this.relativeToWidthProp = relativeToWidthProp
        this.relativeToHeightProp = relativeToHeightProp

        this.regularFill = style.fill
        this.disabledFill = style.disabledFill

        this.setEnabled()
    }

    setEnabled(isEnabled) {
        this.enabled = exists(isEnabled) ? isEnabled : true
        this.tint = this.enabled ? this.regularFill : this.disabledFill
    }

    updatePos(width, height) {
        // First set the position relative to the screen dimensions
        var x = (this.screenWidthProp * width) + this.constantX
        var y = (this.screenHeightProp * height) + this.constantY

        // Then set the position relative to the relativeTo object's position and dimensions
        if (this.relativeTo) {
            x += this.relativeTo.x + (this.relativeTo.width * this.relativeToWidthProp)
            y += this.relativeTo.y + (this.relativeTo.height * this.relativeToHeightProp)
        }

        this.position.set(x, y)
    }

    clicked(point) {
        return this.visible && this.enabled && this.containsPoint(point)
    }
}
