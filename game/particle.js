const sunParticle = {
    alpha: {
        start: 1,
        end: 0
    },
    scale: {
        start: 1.5,
        end: 1.5,
        minimumScaleMultiplier: 1
    },
    color: {
        start: 'ffffff',
        end: '7e8084'
    },
    speed: {
        start: 80,
        end: 0,
        minimumSpeedMultiplier: 0.75
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
        max: 1.2
    },
    blendMode: 'normal',
    frequency: 0.005,
    emitterLifetime: -1,
    maxParticles: 500,
    pos: {
        x: 0,
        y: 0
    },
    addAtBack: false,
    spawnType: 'point'
}
