class DebugCanvas {
  constructor() {
    
    
    this.node = document.createElement('canvas')
    this.node.setAttribute('width', '1920')
    this.node.setAttribute('height', '1080')
    this.node.style.position = 'absolute'
    this.node.style.top = '0'
    this.node.style.left = '0'
    this.context = this.node.getContext('2d')
    document.getElementById('playground').append(this.node)
  }
  
  drawRect(rect) {
    const {x, y, width, height, label} = rect
    
    this.context.beginPath()
    this.context.rect(x, y, width, height)
    this.context.strokeStyle = 'deeppink'
    this.context.stroke()
  }
}

export default DebugCanvas