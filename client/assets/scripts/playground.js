class Playground {
  constructor(args) {
    const {
      playgroundWidth = 1920,
      playgroundHeight = 1080,
    } = args
    
    this.serverWidth = playgroundWidth
    this.serverHeight = playgroundHeight
    
    this.width = this.serverWidth
    this.height = this.serverHeight
    this.scale = 1
    this.reverseScale = 1
    this.x = 0
    this.y = 0
    
    this.node = null
    this.backgroundNode = null
    
    this.init()
  }
  
  init() {
    this.node = document.getElementById('playground') // An already existing node.
    this.backgroundNode = this.node.querySelector('.playground__background')
    
    this.node.style.width = `${this.width}px`
    this.node.style.height = `${this.height}px`
    
    this.applyResponsive()
    
    window.addEventListener('resize', () => {
      this.applyResponsive()
    })
  }
  
  applyResponsive() {
    const { innerWidth:windowWidth, innerHeight:windowHeight } = window

    
    ///// Calculate
    
    const ratioWidth = windowWidth / this.serverWidth
    const ratioHeight = windowHeight / this.serverHeight
    const newScale = Math.min(ratioWidth, ratioHeight)
    
    const reverseRatioWidth = this.serverWidth / windowWidth
    const reverseRatioHeight = this.serverHeight / windowHeight
    const reverseNewScale = Math.max(reverseRatioWidth, reverseRatioHeight)

    
    ///// Save
    
    this.scale = newScale
    this.reverseScale = reverseNewScale
    this.width = this.serverWidth * newScale
    this.height = this.serverHeight * newScale
    
    if (windowWidth > this.width) {
      this.x = (windowWidth - this.width) / 2
    } else {
      this.x = 0
    }
    
    if (windowHeight > this.height) {
      this.y = (windowHeight - this.height) / 2
    } else {
      this.y = 0
    }
    
    
    ///// Apply
    
    this.node.style.transform = `scale(${this.scale})`
    this.node.style.top = `${this.y}px`
    this.node.style.left = `${this.x}px`
    
    const btn = document.querySelector('.join-game-button')
    btn.style.right = `${this.x - 10}px`
    
    const circles = document.querySelector('.impatient-circles')
    circles.style.right = `${this.x - 10}px`
  }
  
  append(node) {
    this.node.append(node)
  }
  
  setBackgroundOpacity(opacity) {
    this.backgroundNode.style.opacity = opacity
  }
}

export default Playground
