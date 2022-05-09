class DebugCanvas {
  static node
  static context
  
  static init() {
    const node = document.createElement('canvas')
    node.classList.add('debug-canvas')
    node.setAttribute('width', '1920')
    node.setAttribute('height', '1080')
    node.style.position = 'absolute'
    node.style.top = '0'
    node.style.left = '0'
    
    const context = node.getContext('2d')
    
    document.getElementById('playground').append(node)
    
    DebugCanvas.node = node
    DebugCanvas.context = context
  }
  
  static drawRect(rect) {
    const {x, y, width, height, label} = rect
    
    DebugCanvas.context.beginPath()
    DebugCanvas.context.rect(x, y, width, height)
    DebugCanvas.context.strokeStyle = 'deeppink'
    DebugCanvas.context.stroke()
  }
}

DebugCanvas.init()

export default DebugCanvas