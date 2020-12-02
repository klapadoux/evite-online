import Utils from './utils.js'

export class Player {
  constructor(args) {
    const {color, x, y, goalPos, velocity, size, dead} = args
    
    this.color = color ? color : '#000'
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.goalPos = goalPos ? goalPos : {x: 0, y: 0}
    this.velocity = velocity ? velocity : 10, // Pixels by ms
    this.size = size ? size : 26
    this.dead = dead ? dead : false
    
    this.defaultVelocity = this.velocity
    this.deathCount = 0
    
    this.createNode()
  }
  
  createNode() {
    this.node = document.createElement('div')
    this.node.classList.add('player')
    this.node.style.backgroundColor = this.color
    this.node.style.width = this.size + 'px'
    this.node.style.height = this.size + 'px'
    this.node.style.top = this.y + 'px'
    this.node.style.left = this.x + 'px'
  }
  
  moveTo({x, y}) {
    this.x = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
  }
  
  
  getEmitParams() {
    return {
      color: this.color,
      goalPos: this.goalPos,
      velocity: this.velocity,
    }
  }
  
  die() {
    this.node.classList.add('dead')
    this.node.style.backgroundColor = Utils.changeColor( 0.75, this.color, '#acbcbf')
    this.deathCount++
  }
  
  resurrect() {
    this.createNode()
    this.dead = false
    return this.node
  }
}

export default Player