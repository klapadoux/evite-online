class ImpatientCircles {
  constructor(args) {
    const {
      node,
      maxCirclesCount = 9
    } = args
    
    this.node = node
    this.maxCirclesCount = maxCirclesCount
    
    
    this.running = false
    this.baseWidth = 0
    this.circlesCount = 0
    this.nextCircleTimeout = null
    
    this.init()
  }
  
  init() {
    console.log(this.node);
    
    this.reinit()
    
    this.baseWidth = this.node.getBoundingClientRect().width
    console.log(this.baseWidth, this.node.getBoundingClientRect());
  }
  
  reinit() {
    if (this.nextCircleTimeout) {
      clearTimeout(this.nextCircleTimeout)
      this.nextCircleTimeout = null
    }
    
    this.running = false
    this.node.innerHTML = ''
    this.circlesCount = 0
  }
  
  start() {
    this.running = true
    this.addCircleAndSetNext()
  }
  
  stop() {
    this.reinit()
  }
  
  addCircleAndSetNext() {
    this.circlesCount++
    console.log('Circles count', this.circlesCount);
    
    const width = this.baseWidth * 1.1 * (this.circlesCount + 1)
    const animationDuration = 10 + (this.circlesCount * 5)
    console.log(this, width);
    
    const circle = document.createElement('span')
    circle.style.width = `${width}px`
    circle.style.height = `${width}px`
    circle.style.animationDuration = `${animationDuration}s`
    
    this.node.append(circle)
    
    window.requestAnimationFrame(function () {
      this.style.opacity = 1
    }.bind(circle))
    
    if (! this.nextCircleTimeout && this.circlesCount < this.maxCirclesCount) {
      this.nextCircleTimeout = setTimeout(() => {
        this.nextCircleTimeout = null
        window.requestAnimationFrame(() => this.addCircleAndSetNext())
      }, 2000)
    }
  }
}

export default ImpatientCircles