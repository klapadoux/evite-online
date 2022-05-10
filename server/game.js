const gameloop = require('node-gameloop')
const Utils = require('./utils.js')
const { checkObjectivesGestation, getObjectives, deleteDeadObjectives } = require('./objective')

class Game {
  constructor() {
    this.score = 0
      
    this.players = {}
    
    this.playerCount = 0
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
      const player = this.players[playerId]
      
      if (player.dead) {
        continue
      }
      
      const { x, y, size } = player
      const playerRadius = size / 2
      
      if (! player.invincible) {
        this.enemies.forEach(enemy => {
          if (
            enemy.y <= y + playerRadius &&
            enemy.x + enemy.size >= x - playerRadius &&
            enemy.y + enemy.size >= y - playerRadius &&
            enemy.x <= x + playerRadius
          ) {
            player.dead = true
            player.velocity = enemy.velocity
            player.goalPos = enemy.goalPos
            
            this.moveElement(player, 0.33)
            
            this.score -= 2
            
            if (0 > this.score) {
              this.score = 0
            }
            
            global.io.emit('player_death', player.id)
          }
        })
        
        // Check again for player death.
        if (player.dead) {
          continue
        }
      }
      
      
      const objectives = getObjectives()
      objectives.forEach(objective => {
        const distance = Utils.get2PosDistance(
          { x, y },
          {
            x: objective.x + objective.size / 2,
            y: objective.y + objective.size / 2,
          }
        )
        
        if (distance <= objective.size / 2 + playerRadius) {
          this.score += 1
          objective.dead = true
        }
      })
    }
  }
  
  updateGameboard(delta) {
    if (this.doGameLoopEnemiesCheck) {
      checkObjectivesGestation(this.playerCount)
      
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
      console.log( 'START GAME' );
      
      this.gameLoopId = gameloop.setGameLoop(this.updateGameboard.bind(this), 1000 / 30)
    }
  }
  
  stopGameloopIfNeeded() {
    if (! Object.keys(this.players).length) {
      console.log( 'STOP GAME' );
      
      gameloop.clearGameLoop(this.gameLoopId)
      this.gameLoopId = null
    }
  }
  
  
  ////////// PLAYERS
  addPlayer(player) {
    this.players[player.id] = player
    this.playerCount++
  }
  
  removePlayerById(playerId) {
    if ('undefined' === typeof this.players[playerId]) {
      // BAIL, already removed.
      return
    }
    
    delete this.players[playerId]
    this.playerCount--
  }
  
  updateAllPlayers(delta) {
    for (const playerId in this.players) {
      if (! this.players[playerId].dead) {
        this.moveElement(this.players[playerId], delta)
      }
    }
  }
  
  updatePlayer(data, isPlayerResurrecting = false) {
    const { id, velocity, goalPos } = data
    const player = this.getPlayerById(id)

    if (! player) {
      // BAIL, not a player.
      return
    }
    
    player.goalPos = goalPos
    player.velocity = velocity
    
    if (isPlayerResurrecting) {
      player.x = goalPos.x
      player.y = goalPos.y
      player.dead = false
    }
  }
  
  setPlayerPos(data) {
    const { id, goalPos } = data
    const player = this.getPlayerById(id)
    
    if (! player) {
      // BAIL, not a player.
      return
    }
    
    const { x, y } = goalPos
    
    player.x = x
    player.y = y
    player.goalPos = goalPos
  }
  
  getPlayerById(playerId) {
    if ('undefined' !== typeof this.players[playerId]) {
      return this.players[playerId]
    }
    
    return false
  }
  
  getPlayersEmitParams() {
    const playersParams = []
    for (const player in this.players) {
      const { id, x, y, goalPos, velocity, color, dead } = this.players[player]
      playersParams.push({
        id,
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