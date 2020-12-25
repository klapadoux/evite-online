const gameloop = require('node-gameloop')
const Utils = require('./utils.js')
const {checkObjectivesGestation, getObjectives, deleteDeadObjectives} = require('./objective')

class Game {
  constructor() {
    this.score = 0
      
    this.players = {}
    
    this.enemies = []
    this.enemiesBirthCount = 0
    this.enemiesAreGestating = false
    
    this.doGameLoopEnemiesCheck = true
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
  
  /**
   * @todo Corriger les collisions
   */
  checkCollisions() {
    // Players circle against enemies square.
    for (const playerId in this.players) {
      if (this.players[playerId].dead) {
        continue
      }
      
      const {x, y, size} = this.players[playerId]
      const playerRadius = size / 2
      
      this.enemies.forEach(enemy => {
        if (
          enemy.y <= y + playerRadius &&
          enemy.x + enemy.size >= x - playerRadius &&
          enemy.y + enemy.size >= y - playerRadius &&
          enemy.x <= x + playerRadius
        ) {
          this.players[playerId].dead = true
          this.players[playerId].velocity = enemy.velocity
          this.players[playerId].goalPos = enemy.goalPos
          
          this.moveElement(this.players[playerId], 0.33)
          
          this.score -= 1
          
          global.io.emit('player_death', this.players[playerId].color)
        }
      })
      
      // Check again for player death.
      if (this.players[playerId].dead) {
        continue
      }
      
      const objectives = getObjectives()
      objectives.forEach(objective => {
        const distance = Utils.get2PosDistance(
          {x, y},
          {x: objective.x + objective.size / 2, y: objective.y + objective.size / 2}
        )
        if (distance <= objective.size / 2 + playerRadius) {
          this.score += 2
          objective.dead = true
        }
      })
    }
  }
  
  updateGameboard(delta) {
    if (this.doGameLoopEnemiesCheck) {
      checkObjectivesGestation()
      
      this.checkEnemiesGestation()
      this.checkCollisions()
      this.updateEnemies(delta)
    }
    
    this.updateAllPlayers(delta)
    
    this.emitUpdateToClients()
    
    if (this.doGameLoopEnemiesCheck) {
      this.deleteDeadEnemies()
      deleteDeadObjectives()
    }
    
    this.doGameLoopEnemiesCheck =  ! this.doGameLoopEnemiesCheck
  }
  
  emitUpdateToClients() {
    global.io.emit('tick_update', {
      score: this.score,
      enemies: this.enemies,
      players: this.getPlayersEmitParams(),
      objectives: getObjectives(),
    })
  }
  
  
  
  ////////// GAMELOOP
  startGameloopIfNeeded() {
    if (! this.gameLoopId) {
      this.gameLoopId = gameloop.setGameLoop(this.updateGameboard.bind(this), 1000 / 30)
    }
  }
  
  stopGameloopIfNeeded() {
    if (! Object.keys(this.players).length) {
      gameloop.clearGameLoop(this.gameLoopId)
      this.gameLoopId = null
    }
  }
  
  
  ////////// PLAYERS
  updateAllPlayers(delta) {
    for (const playerId in this.players) {
      if (! this.players[playerId].dead) {
        this.moveElement(this.players[playerId], delta)
      }
    }
  }
  
  updatePlayer(data, isPlayerResurrecting = false) {
    const {color, velocity} = data
    const player = this.getPlayerByColor(color)
    
    if (player) {
      player.goalPos = data.goalPos
      player.velocity = data.velocity
      
      if (isPlayerResurrecting) {
        player.x = data.goalPos.x
        player.y = data.goalPos.y
        player.dead = false
      }
    }
  }
  
  getPlayerByColor(playerColor) {
    for(const playerId in this.players) {
      if ('undefined' !== typeof this.players[playerId].color && playerColor === this.players[playerId].color) {
        return this.players[playerId]
      }
    }
    
    return null
  }
  
  getPlayersEmitParams() {
    const playersParams = []
    for (const player in this.players) {
      const {x, y, goalPos, velocity, color, dead} = this.players[player]
      playersParams.push({
        x,
        y,
        color,
        goalPos,
        velocity, // Pixels by ms
        dead,
      })
    }
    return playersParams
  }
  
  
  ////////// ENEMIES
  checkEnemiesGestation() {
    // Entamer la création d'enemies si ce n'est pas déjà en cours.
    if (! this.enemiesAreGestating) {
      this.enemiesAreGestating = true
      setTimeout(() => {
        const size = Math.min(275, Math.floor(Math.random() * 100) + 40 + this.score)
        const y = Math.floor(Math.random() * 1080) - size
        const goalY = (100 > this.score) ? y : Math.floor(Math.random() * 1080) - size
        this.enemies.push({
          id: ++this.enemiesBirthCount,
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
  
  deleteDeadEnemies() {
    this.enemies.forEach((enemy, index) => {
      if (enemy.dead) {
        this.enemies.splice(index, 1)
      }
    })
  }
}

module.exports = Game