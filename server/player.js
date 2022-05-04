const Settings = require('./settings')

const createPlayer = (data) => {
  return {
    id: data.id ? data.id : 0,
    pseudo: data.pseudo ? data.pseudo : 'undefined',
    color: data.color ? data.color : '#000000',
    x: data.x ? data.x : 300,
    y: data.y ? data.y : 300,
    size: data.size ? data.size : 26,
    goalPos: data.goalPos ? data.goalPos : {x: 300, y: 300},
    velocity: data.velocity ? data.velocity : 2500, // Pixels by ms
    dead: data.dead ? data.dead : false,
    invincible: data.invincible ? data.invincible : Settings.SHOW_SPAWN_RECT,
  }
}

module.exports.createPlayer = createPlayer
