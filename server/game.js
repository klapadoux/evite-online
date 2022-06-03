const gameloop = require('node-gameloop')
const settings = require('./settings.js')
const Utils = require('./utils.js')
const { checkObjectivesGestation, getObjectives, deleteDeadObjectives } = require('./objective')
const { createTeamObjective, getTeamObjectives, deleteDeadTeamObjectives } = require('./team-objective')

class Game {
  constructor() {
    this.score = 0
      
    this.players = {}
    
    this.playerCount = 0
    this.enemies = []
    this.enemiesBirthCount = 0
    this.enemiesAreGestating = false
    
    this.skipSomeChecksThisLoop = true
    
    this.playgroundWidth = settings.PLAYGROUND_WIDTH
    this.playgroundHeight = settings.PLAYGROUND_HEIGHT
    
    this.safeZoneWidth = settings.SAFE_ZONE_SIZE
    
    this.fpms = settings.FPMS
    
    this.hasTeamObjective = false
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
      const playerIsInSafeZone = x >= this.playgroundWidth - this.safeZoneWidth
      
      if (! player.invincible && ! playerIsInSafeZone) {
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
          this.score += settings.OBJECTIVE_SCORE
          objective.dead = true
        }
      })
      
      const teamObjectives = getTeamObjectives()
      teamObjectives.forEach(objective => {
        const distance = Utils.get2PosDistance(
          { x, y },
          {
            x: objective.x + objective.size / 2,
            y: objective.y + objective.size / 2,
          }
        )
        
        if (distance <= objective.size / 2 + playerRadius) {
          this.score += settings.OBJECTIVE_SCORE
          objective.dead = true
          this.hasTeamObjective = false
        }
      })
    }
  }
  
  updateGameboard(delta) {
    if (this.skipSomeChecksThisLoop) {
      checkObjectivesGestation(this.playerCount)
      
      if (! this.hasTeamObjective) {
        console.log('CREATE TEAM OBJECTIVE');
        this.hasTeamObjective = true
        createTeamObjective()
      }
      
      this.checkEnemiesGestation()
      this.checkCollisions()
      this.updateEnemies(delta)
    }
    
    this.updateAllPlayers(delta)
    
    this.emitUpdateToClients()
    
    if (this.skipSomeChecksThisLoop) {
      this.deleteDeadEnemies()
      deleteDeadObjectives()
      deleteDeadTeamObjectives()
    }
    
    this.skipSomeChecksThisLoop =  ! this.skipSomeChecksThisLoop
  }
  
  emitUpdateToClients() {
    global.io.emit('tick_update', {
      score: this.score,
      enemies: this.enemies,
      players: this.getPlayersEmitParams(),
      objectives: getObjectives(),
      teamObjectives: getTeamObjectives(),
    })
  }
  
  
  
  ////////// GAMELOOP
  startGameloopIfNeeded() {
    if (! this.gameLoopId) {
      console.log( 'START GAME' );
      
      this.gameLoopId = gameloop.setGameLoop(this.updateGameboard.bind(this), this.fpms)
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
    const { id, velocity, goalPos, currentAction } = data
    const player = this.getPlayerById(id)

    if (! player) {
      // BAIL, not a player.
      return
    }
    
    player.goalPos = goalPos
    player.velocity = velocity
    player.currentAction = currentAction
    
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
      const { id, x, y, goalPos, velocity, color, dead, currentAction } = this.players[player]
      playersParams.push({
        id,
        x,
        y,
        color,
        goalPos,
        velocity, // Pixels by ms
        dead,
        currentAction,
      })
    }
    return playersParams
  }
  
  
  ////////// ENEMIES
  checkEnemiesGestation() {
    // Entamer la création d'enemies si ce n'est pas déjà en cours.
    if (this.enemiesAreGestating) {
      // BAIL. Already gestating.
      return
    }
    
    this.enemiesAreGestating = true
    
    setTimeout(() => {
      // const size = Math.min(300, Math.floor(Math.random() * this.score * 4) + 40)
      // let size = (100 > this.score) ? Math.floor(Math.random() * 260) + 40 : Math.floor(Math.random() * 260) + this.score
      let size = 0
      if (10 > this.score) {
        size = Math.floor(Math.random() * 100) + 30
      } else if (30 > this.score) {
        size = Math.floor(Math.random() * 200) + 30
      } else if (50 > this.score) {
        size = Math.floor(Math.random() * 270) + 40
      } else if (100 > this.score) {
        size = Math.floor(Math.random() * 280) + 50
      } else {
        size = Math.floor(Math.random() * 250) + this.score
      }
      
      
      const y = Math.floor(Math.random() * this.playgroundHeight) - size / 2
      
      let goalY = y
      if (100 <= this.score && 0.5 < Math.random()) {
        // Half will go diagonally past 100 score.
        goalY = Math.floor(Math.random() * this.playgroundHeight) - size / 2
      }
      
      
      this.enemies.push({
        id: ++this.enemiesBirthCount,
        x: size * -1.25,
        y: y,
        goalPos: {
          x: this.playgroundWidth,
          y: goalY,
        },
        // velocity: Math.floor(Math.random() * 475) + 100, // Pixels by ms
        velocity: Math.max(100, 900 - size * 5) + Math.min(400, this.score) + Math.random() * 100, // Pixels by ms
        size: size,
        dead: false,
      })
      
      this.enemiesAreGestating = false
    }, Math.max(450, 5000 / (this.score + 1 / 2)));
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