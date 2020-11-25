export class Enemy {
  constructor(args) {
    const {id, x, y, goalPos, velocity, size, dead} = args
    
    this.id = id
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.goalPos = goalPos ? goalPos : {x: 0, y: 0}
    this.velocity = velocity ? velocity : 10, // Pixels by ms
    this.size = size ? size : 20,
    this.dead = dead ? dead : false
    
    this.createNode()
  }
  
  createNode() {
    this.node = document.createElement('div')
    this.node.classList.add('enemy')
    this.node.style.width = this.size + 'px'
    this.node.style.height = this.size + 'px'
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
  
  moveTowardsGoal() {
    this.moveTo({x: this.x, y: this.y})
  }
  
  moveTo({x, y}) {
    this.x = x
    this.y = y
    this.node.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }
}

export default Enemy