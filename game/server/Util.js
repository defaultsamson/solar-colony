function addPosition(obj) {
    obj.position = {}
    obj.position.x = 0
    obj.position.y = 0

    function setter(x1, y1) {
        obj.position.x = x1
        obj.position.y = y1
    }
    obj.position.set = setter
}

global.addPosition = addPosition
