import Utils from './utils.js'

export class Player {
  constructor(args) {
    const { id, color, x, y, goalPos, velocity, size, dead } = args
    
    this.id = id
    this.color = color ? color : '#000000'
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.goalPos = goalPos ? goalPos : {x: 0, y: 0}
    this.velocity = velocity ? velocity : 10, // Pixels by ms
    this.size = size ? size : 26
    this.dead = dead ? dead : false
    
    this.defaultVelocity = this.velocity
    this.deathCount = 0
    this.currentAction = 'none'
    
    this.init()
  }
  
  init() {
    this.createNode()
    this.setCurrentAction(this.currentAction);
  }
  
  update(args) {
    const { currentAction } = args
    
    this.moveTo(args)

    this.setCurrentAction(currentAction)
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
  
  moveTo({ x, y }) {
    this.x = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
  }
  
  teleportTo(pos) {
    this.setCurrentAction('teleport')
    this.setPos(pos)
  }
  
  setPos(pos) {
    const { x, y } = pos
    
    this.x = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
    this.goalPos = pos
  }
  
  getEmitParams() {
    return {
      id: this.id,
      goalPos: this.goalPos,
      velocity: this.velocity,
      currentAction: this.currentAction,
    }
  }
  
  die() {
    this.node.classList.remove(`player--${this.currentAction}`)
    this.currentAction = 'none'
    
    this.node.classList.add('player--dead')
    this.dead = true
    
    this.node.style.backgroundColor = Utils.changeColor( 0.75, this.color, '#acbcbf')
    this.deathCount++
    console.log(this);
  }
  
  resurrect() {
    this.createNode()
    this.dead = false
    return this.node
  }
  
  setCurrentAction(action = 'none') {
    if (this.dead || action === this.currentAction) {
      // BAIL. No change here.
      return
    }
    
    console.log('Set action', action);
    
    this.node.classList.remove(`player--${this.currentAction}`)
    
    this.node.classList.add(`player--${action}`)
    this.currentAction = action
  }
}

export default Player