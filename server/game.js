const gameloop = require('node-gameloop')

class Game {
  constructor(socketIo) {
    this.io = socketIo
  }
  
  startGameloopIfNeeded() {
    if (!this.gameLoopId) {
      this.gameLoopId = this.gameloop.setGameLoop(this.updateGameboard, 1000 / 30)
    }
  }
}