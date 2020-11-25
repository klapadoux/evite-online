export class Objective {
  constructor(args) {
    const {id, x, y, size, dead} = args
    
    this.id = id
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.size = size ? size : 30,
    this.dead = dead ? dead : false
    
    this.createNode()
  }
  
  createNode() {
    this.node = document.createElement('div')
    this.node.classList.add('objective')
    this.node.style.width = this.size + 'px'
    this.node.style.height = this.size + 'px'
    this.node.style.top = this.y + 'px'
    this.node.style.left = this.x + 'px'
  }

  update(data) {
    Object.assign(this, data)
  }
  
  isDead() {
    return this.dead
  }
}

export default Objective