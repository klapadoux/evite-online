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
    this.node.style.width = this.size + 'px' // Size is controlled by font size
    this.node.style.height = this.size + 'px' // Size is controlled by font size
    this.node.style.top = this.y + 'px'
    this.node.style.left = this.x + 'px'
    
    const backStar = document.createElement('div')
    backStar.classList.add('objective__star', 'objective__star--back')
    this.node.append(backStar)
    
    const frontStar = document.createElement('div')
    frontStar.classList.add('objective__star', 'objective__star--front')
    this.node.append(frontStar)
  }

  update(data) {
    Object.assign(this, data)
  }
  
  isDead() {
    return this.dead
  }
}

export default Objective