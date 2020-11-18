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
    
    let blood1 = document.createElement('span')
    blood1.style.top = (Math.floor(Math.random()*10) - 5) + 'px'
    blood1.style.left = (Math.floor(Math.random()*10) - 5) + 'px'
    blood1.classList.add('blood')
    blood1.classList.add(`blood--${Math.floor(Math.random()*8)}`)
    this.node.append(blood1)
    
    let blood2 = document.createElement('span')
    blood2.style.top = (Math.floor(Math.random()*10) - 5) + 'px'
    blood2.style.left = (Math.floor(Math.random()*10) - 5) + 'px'
    blood2.classList.add('blood')
    blood2.classList.add(`blood--${Math.floor(Math.random()*8)}`)
    this.node.append(blood2)
  }
  
  resurrect() {
    this.createNode()
    this.dead = false
    return this.node
  }
}

export default Player