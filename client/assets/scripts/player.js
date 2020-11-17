export class Player {
  constructor(args) {
    const {color, x, y, size} = args
    
    this.color = color ? color : '#000'
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.size = size ? size : 30
    
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
}

export default Player