const sunParticle = {
    alpha: {
        start: 0.2,
        end: 0
    },
    scale: {
        start: 1,
        end: 1,
        minimumScaleMultiplier: 1
    },
    color: {
        start: 'ffffff',
        end: 'f0ffff'
    },
    speed: {
        start: 20,
        end: 0,
        minimumSpeedMultiplier: 0.2
    },
    acceleration: {
        x: 1,
        y: 1
    },
    maxSpeed: 0,
    startRotation: {
        min: 0,
        max: 360
    },
    noRotation: true,
    rotationSpeed: {
        min: 0,
        max: 0
    },
    lifetime: {
        min: 1,
        max: 1
    },
    blendMode: 'normal',
    frequency: 0.03333,
    emitterLifetime: -1,
    maxParticles: 32,
    pos: {
        x: 0,
        y: 0
    },
    addAtBack: false,
    spawnType: 'point'
}

const infantryParticle = {
    alpha: {
        start: 1,
        end: 0
    },
    scale: {
        start: 2,
        end: 1,
        minimumScaleMultiplier: 1
    },
    color: {
        start: 'ffffff',
        end: 'f0ffff'
    },
    speed: {
        start: 195,
        end: 2,
        minimumSpeedMultiplier: 1
    },
    acceleration: {
        x: 0,
        y: 0
    },
    maxSpeed: 0,
    startRotation: {
        min: 0,
        max: 360
    },
    noRotation: true,
    rotationSpeed: {
        min: 0,
        max: 0
    },
    lifetime: {
        min: 1,
        max: 1
    },
    blendMode: 'normal',
    frequency: 0.5,
    emitterLifetime: -1,
    maxParticles: 1,
    pos: {
        x: 0,
        y: 0
    },
    addAtBack: false,
    spawnType: 'point'
}
