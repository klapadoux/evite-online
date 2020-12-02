export class Enemy {
  constructor(args) {
    const {id, x, y, goalPos, velocity, size, dead, color} = args
    
    this.id = id
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.goalPos = goalPos ? goalPos : {x: 0, y: 0}
    this.velocity = velocity ? velocity : 10, // Pixels by ms
    this.size = size ? size : 20,
    this.dead = dead ? dead : false
    this.color = color ? color : 'red'
    
    this.createNode()
  }
  
  createNode() {
    this.node = document.createElement('div')
    this.node.classList.add('enemy')
    this.node.style.width = this.size + 'px'
    this.node.style.height = this.size + 'px'
    this.node.style.backgroundColor = this.color
    
    this.shadowNode = document.createElement('div')
    this.shadowNode.classList.add('enemy-shadow')
    this.shadowNode.style.width = this.size + 4 + 'px'
    this.shadowNode.style.height = this.size + 4 + 'px'
    
    this.moveTowardsGoal()
  }
  
  /**
   * Update object data.
   * 
   * @param {object} data 
   */
  update(data) {
    Object.assign(this, data)
    this.moveTowardsGoal()
  }
  
  isDead() {
    return this.dead
  }
  
  die() {
    this.node.remove()
    this.shadowNode.remove()
  }
  
  moveTowardsGoal() {
    this.moveTo({x: this.x, y: this.y})
  }
  
  moveTo({x, y}) {
    this.x = x
    this.y = y
    this.node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    this.shadowNode.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0)`
  }
}

export default Enemy