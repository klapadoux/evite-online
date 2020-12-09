const gameloop = require('node-gameloop')
const Utils = require('./utils.js')

class Game {
  constructor(socketIo) {
    this.io = socketIo
    
    this.score = 0
      
    this.players = {}
    
    this.enemies = []
    this.ennemiesBirthCount = 0
    this.enemiesAreGestating = false
    
    this.doGameLoopEnnemiesCheck = true
  }
  
  ////////// GENERAL
  moveElement(element, delta = 1) {
    // Calculating next step.
    const nextStep = element.velocity * delta
    const remainingDistance = Utils.get2PosDistance(element.goalPos, {x: element.x, y: element.y})
    let reachedGoal = false
    if (nextStep < remainingDistance) {
      const ratio = nextStep / remainingDistance
      const stepX = (element.goalPos.x - element.x) * ratio
      const stepY = (element.goalPos.y - element.y) * ratio
      element.x = element.x + stepX
      element.y = element.y + stepY
    } else {
      element.x = element.goalPos.x
      element.y = element.goalPos.y
      reachedGoal = true
    }
    
    return reachedGoal
  }
  
  
  
  ////////// GAMELOOP
  startGameloopIfNeeded() {
    if (!this.gameLoopId) {
      this.gameLoopId = this.gameloop.setGameLoop(this.updateGameboard, 1000 / 30)
    }
  }
  
  stopGameloopIfNeeded() {
    if (!Object.keys(this.players).length) {
      this.gameloop.clearGameLoop(this.gameLoopId)
      this.gameLoopId = null
    }
  }
  
  
  ////////// ENNEMIES
  checkEnnemiesGestation() {
    // Entamer la création d'ennemies si ce n'est pas déjà en cours.
    if (!this.enemiesAreGestating) {
      this.enemiesAreGestating = true
      setTimeout(() => {
        const size = Math.min(275, Math.floor(Math.random() * 100) + 40 + score)
        const y = Math.floor(Math.random() * 1080) - size
        const goalY = (100 > score) ? y : Math.floor(Math.random() * 1080) - size
        this.enemies.push({
          id: ++this.ennemiesBirthCount,
          x: size * -1.25,
          y: y,
          goalPos: {
            x: 1920,
            y: goalY,
          },
          velocity: Math.floor(Math.random() * 475) + 100, // Pixels by ms
          size: size,
          dead: false,
        })
        
        this.enemiesAreGestating = false
      }, Math.max(500, 5000 / (Math.max(this.score, 1) / 2)));
    }
  }
  
  updateEnemies(delta) {
    this.enemies.forEach(enemy => {
      enemy.dead = this.moveElement(enemy, delta)
    })
  }
}