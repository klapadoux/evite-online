const createPlayer = (data) => {
  return {
    color: data.color ? data.color : '#000',
    x: data.x ? data.x : 300,
    y: data.y ? data.y : 300,
    size: data.size ? data.size : 30,
    goalPos: data.goalPos ? data.goalPos : {x: 300, y: 300},
    velocity: data.velocity ? data.velocity : 2000, // Pixels by ms
    dead: data.dead ? data.dead : false,
  }
}

module.exports.createPlayer = createPlayer
