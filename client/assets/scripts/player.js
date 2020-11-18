export class Player {
  constructor(args) {
    const {color, x, y, size, dead} = args
    
    this.color = color ? color : '#000'
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.size = size ? size : 30
    this.dead = dead ? dead : false
    
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
    this.y = x
    this.y = y
    this.node.style.top = y + 'px'
    this.node.style.left = x + 'px'
  }
  
  
  getEmitParams() {
    return {
      color: this.color,
      x: this.x,
      y: this.y,
    }
  }
  
  die() {
    this.node.style.opacity = 0.5
    this.node.classList.add('dead')
    
    let blood = document.createElement('span')
    blood.classList.add('blood')
    this.node.append(blood)
  }
}

export default Player