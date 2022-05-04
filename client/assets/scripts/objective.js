export class Objective {
  constructor(args) {
    const { id, x, y, size, dead } = args
    
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
    this.node.style.fontSize = this.size + 'px' // Size is controlled by font size
    this.node.style.top = this.y + 'px'
    this.node.style.left = this.x + 'px'
    
    const innerNode = document.createElement('div')
    innerNode.classList.add('objective__inner')
    
    this.node.append(innerNode)
  }

  update(data) {
    Object.assign(this, data)
  }
  
  isDead() {
    return this.dead
  }
}

export default Objective