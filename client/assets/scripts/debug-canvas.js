class DebugCanvas {
  constructor() {
    this.canvas = document.querySelector('canvas')
    this.canvasCtx = canvas.getContext('2d')
  }
  
  static drawRect(rect) {
    const {x, y, width, height, label} = rect
    
    this.canvasCtx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.stroke()
  }
}

export default DebugCanvas