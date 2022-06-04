import Utils from './utils.js'

export class Objective {
  constructor(args) {
    const { id, x, y, size, dead } = args
    
    this.id = id
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.size = size ? size : 30
    this.dead = dead ? dead : false
    
    this.lastRelativeSize = this.size
    
    this.node = null
    
    this.createNode()
  }
  
  createNode() {
    this.node = document.createElement('div')
    this.node.classList.add('objective')
    
    const backStar = document.createElement('div')
    backStar.classList.add('objective__star', 'objective__star--back')
    this.node.append(backStar)
    
    const frontStar = document.createElement('div')
    frontStar.classList.add('objective__star', 'objective__star--front')
    this.node.append(frontStar)
    
    this.applyStyleProperties()
  }

  update(data) {
    Object.assign(this, data)
    this.applyStyleProperties()
  }
  
  applyStyleProperties() {
    // Slightly smaller to make it seem with a bigger hitbox.
    const relativeSize = this.size * 0.75
    const difference = this.size - relativeSize 
    
    if (this.lastRelativeSize !== relativeSize) {
      this.node.style.fontSize = `${relativeSize}px` // Size is controlled by font size
      this.node.style.width = `${relativeSize}px`
      this.node.style.height = `${relativeSize}px`
    }
    
    this.node.style.top = this.y + difference / 2 + 'px'
    this.node.style.left = this.x + difference / 2 + 'px'
    
    // Utils.addTestPoint(document.getElementById('playground'), { x: this.x + this.size / 2, y: this.y + this.size / 2 })
    // Utils.addTestPoint(document.getElementById('playground'), { x: this.x + difference / 2, y: this.y + difference / 2 })
  }
  
  isDead() {
    return this.dead
  }
}

export default Objective