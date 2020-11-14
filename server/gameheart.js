/**
 * Original
 * @link https://github.com/jannesiera/gameheart/blob/master/index.js
 */

class Gameheart {
  constructor(mSecTick, maxFps, maxSkippedFrames, update, render) {
    this.mSecTick = mSecTick // Milliseconds inbetween update ticks
    this.maxFps = maxFps // Cap on render actions per second (usually 60)
    this.mSecFrame = Math.floor(1000 / maxFps) // Milliseconds inbetween frames (when non are skipped) - calculated by maxFps
    this.maxSkippedFrames = maxSkippedFrames // Max render frames to be skipped before we draw another one in favor of "catching up" on ticks
    
    this.update = update // Update function (takes dt and t)
    this.render = render // Render function (takes dt)
    
    this.nextTick // Timestamp of the next tick to process
    this.nextFrame // Timestamp of the next render frame to process
    this.lastFrame // Timestamp for last rendered frame
    this.fps // Calculated fps for actual rendering
    
    this.realFps
    this.trappedFrames = []
    
    this.state = 'off'
  }

  /**
   * @private
   */
  // After render or update determine what process to call next based on real time passed
  queueNextAction() {
    const currentTime = new Date().getTime()
    const framesSkipped = Math.floor((currentTime - this.nextFrame) / this.mSecFrame) || 0
    
    // 1. if we skipped to many frames, force a render
    if(this.maxSkippedFrames >= framesSkipped) {
      setTimeout(() => {
        this.processFrame(framesSkipped)
      },0)
      return // exit
    }
    
    // 2. if we passed the next tick already, call processTick on that one
    if(this.nextTick <= currentTime) {
      setTimeout(() => {
        this.processTick()
      },0)
      return // exit
    }
    
    // 3. if we passed a frame, render the frame
    if(this.nextFrame <= currentTime) {
      setTimeout(() => {
        this.processFrame(framesSkipped)
      },0)
      return // exit
    }
    
    // 4. we have real time left, timeout till next tick or frame
    if(this.nextTick <= this.nextFrame) { // tick is next
      const timeLeft = this.nextTick - currentTime
      setTimeout(() => {
        this.processTick()
      }, timeLeft)
      return // exit
    }
    else { // frame is next
      const timeLeft = this.nextFrame - currentTime
      setTimeout(() => {
        this.processFrame(framesSkipped)
      }, timeLeft)
      return // exit
    }
  }

  /**
   * @private
   */
  processTick() {
    const currentTime = new Date().getTime()
    this.nextTick += this.mSecTick // define next tick
    this.update(this.mSecTick, currentTime) // call the actual update function
    this.queueNextAction() // queue next action
  }

  /**
   * @private
   */
  processFrame(framesSkipped) {
    this.nextFrame += framesSkipped * this.mSecFrame // in case frames have been skipped, set nextFrame accordingly
    this.lastFrame = this.nextFrame
    this.nextFrame += this.mSecFrame // Increment nextFrame
    
    this.calculateFps()
    
    const currentTime = new Date().getTime()
    const dt = currentTime - (this.nextTick - this.mSecTick) // Get the time between now and last update()
    
    this.render(dt) // call the actual render function
    this.queueNextAction() // queue next action
  }

  /**
   * @private
   */
  calculateFps() {
    const currentTime = new Date().getTime()
    this.fps = 1 / (currentTime - this.lastFrame)
    this.trappedFrames.push(this.fps)
  }
  
  /**
   * @private
   */
  setRealFps() {
    this.realFps = this.trappedFrames.reduce((accumulator, currentValue) => accumulator + currentValue)
    this.trappedFrames = []
    
    setTimeout(() => {
      this.setRealFps()
    }, 1000);
  }
  
  
  /**
   * @public
   */
  start() {
    const currentTime = new Date().getTime()
    this.nextTick = currentTime + this.mSecTick
    this.update()
    
    // Récolter une deuxième fois le temps ? Pour précision ?
    // currentTime = new Date().getTime()
    
    this.nextFrame = currentTime + this.mSecFrame
    this.render()
    
    this.queueNextAction()
    
    setTimeout(() => {
      this.setRealFps()
    }, 1000);
  }
  
  /**
   * Very simple momentary fps counter
   * For the future, consider: http://stackoverflow.com/questions/87304/calculating-frames-per-second-in-a-game
   * 
   * @public
   */
  getFps() {
    return this.fps
  }
  
  /**
   * Very simple momentary fps counter
   * For the future, consider: http://stackoverflow.com/questions/87304/calculating-frames-per-second-in-a-game
   * 
   * @public
   */
  getRealFps() {
    return this.realFps
  }
}

// export default Gameheart
module.exports = Gameheart