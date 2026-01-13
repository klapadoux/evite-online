const settings = require('./settings')

const createPlayer = (data) => {
  return {
    id: data.id ? data.id : 0,
    name: data.name ? data.name : 'undefined',
    pseudo: data.pseudo ? data.pseudo : 'undefined',
    color: data.color ? data.color : '#000000',
    x: data.x ? data.x : 300,
    y: data.y ? data.y : 300,
    size: data.size ? data.size : 26,
    goalPos: data.goalPos ? data.goalPos : {x: 300, y: 300},
    velocity: data.velocity ? data.velocity : 2500, // Pixels by ms
    dead: data.dead ? data.dead : false,
    paused: data.paused ? data.paused : false,
    currentAction: data.currentAction ? data.currentAction : 'none',
    linksToEls: data.linksToEls ? data.linksToEls : [],
    invincible: data.invincible ? data.invincible : settings.INVINCIBLE_PLAYERS,
  }
}

module.exports.createPlayer = createPlayer
