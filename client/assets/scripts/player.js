export class Player {
  constructor(args) {
    const {color, x, y, size, dead} = args
    
    this.color = color ? color : '#000'
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.size = size ? size : 30
    this.dead = dead ? dead : false
    
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
    this.node.classList.add('dead')
    this.deathCount++
    this.addBlood()
    this.addBlood()
  }
  
  addBlood() {
    let blood = document.createElement('span')
    blood.style.top = (Math.floor(Math.random()*50) - 15) + '%'
    blood.style.left = (Math.floor(Math.random()*50) - 15) + '%'
    blood.style.width = (Math.floor(Math.random()*70) + 30) + '%'
    blood.style.height = (Math.floor(Math.random()*70) + 30) + '%'
    blood.classList.add('blood')
    // blood.classList.add(`blood--${Math.floor(Math.random()*8)}`)
    this.node.append(blood)
  }
  
  resurrect() {
    this.createNode()
    this.dead = false
    return this.node
  }
}

export default Player