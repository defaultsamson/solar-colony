class Hud extends PIXI.Container {
    constructor() {
        super()
    }

    update() {
        hud.position.copy(viewport.toWorld(0, 0))
        hud.scale.set(1 / game.stage.scale.x)
    }

    resize(width, height) {
        if (!exists(width)) {
            width = window.innerWidth
            height = window.innerHeight
        }

        pixelText.position.set(hudMargin, hudMargin)
        shipsText.position.set(hudMargin, hudMargin + pixelText.height + 2)

        buy1ShipText.position.set(width / 2 - buy1ShipText.width - 100, (height - buy1ShipText.height) / 2 + buy10ShipText.height + 2)
        buy10ShipText.position.set(width / 2 - buy10ShipText.width - 100, (height - buy10ShipText.height) / 2)
        buy100ShipText.position.set(width / 2 - buy100ShipText.width - 100, (height - buy100ShipText.height) / 2 - buy10ShipText.height - 2)

        sendShipText.position.set(width / 2 + 100, (height - buy10ShipText.height) / 2)

        buySpawnText.position.set(width / 2 - (buySpawnText.width / 2), -100 + (height - buySpawnText.height) / 2)
    }
}
