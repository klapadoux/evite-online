const gameloop = require('node-gameloop')
const settings = require('./settings.js')
const Utils = require('./utils.js')
const { checkObjectivesGestation, getObjectives, deleteDeadObjectives } = require('./objective')
const { createTeamObjective, getTeamObjectives, deleteDeadTeamObjectives, resetTeamObjectivesLinkedPlayersCount } = require('./team-objective')

class Game {
  constructor() {
    this.score = 0

    this.players = {}

    this.playerCount = 0
    this.enemies = []
    this.enemiesBirthCount = 0
    this.enemyGestatingPressure = 0

    this.skipSomeChecksThisLoop = false

    this.playgroundWidth = settings.PLAYGROUND_WIDTH
    this.playgroundHeight = settings.PLAYGROUND_HEIGHT

    this.safeZoneWidth = settings.SAFE_ZONE_SIZE

    this.fpms = settings.FPMS

    this.gameHasTeamObjective = false

    this.victoryEmitted = false
    this.newGameStartPressure = 0

    // Try to always give a safe path to the players by making enemies not spawn to that Y.
    this.safeY = Math.floor(Math.random() * this.playgroundHeight)
    this.safeYGoal = this.safeY
    this.safeYHeight = 40
    this.safeYVelocity = 5
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
  checkCollisions(delta) {
    const objectives = getObjectives()
    const teamObjectives = getTeamObjectives()
    resetTeamObjectivesLinkedPlayersCount()

    // For each players, check collisions.
    for (const playerId in this.players) {
      const player = this.players[playerId]
      this.resetPlayerLinks(player) // Reset each loop. Links will be recalculated here.

      if (player.dead) {
        continue
      }

      const { x, y, size } = player
      const playerRadius = size / 2
      const playerIsInSafeZone = x >= this.playgroundWidth - this.safeZoneWidth

      ///// PLAYER AND MORTAL OBSTACLES
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

            this.score -= settings.PLAYER_DEATH_SCORE

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


      ///// OBJECTIVES
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

      ///// TEAM OBJECTIVES
      teamObjectives.forEach(objective => {
        if (objective.dead || 5 <= objective.playersLinked) {
          // BAIL. Dead or Max player influence reached.
          return
        }

        const halfSize = objective.size / 2
        const distance = Utils.get2PosDistance(
          { x, y },
          {
            x: objective.x + halfSize,
            y: objective.y + halfSize,
          }
        )

        const pullDistance = 300
        if (pullDistance > distance) {
          const pullForce = (pullDistance - distance) / 4

          // TEST DEBUG
          // const pullForce = (pullDistance - distance)

          objective.velocity = pullForce
          objective.goalPos = {
            x: player.x - halfSize,
            y: player.y - halfSize
          }
          this.moveElement(objective, delta)
          objective.playersLinked++
          this.linkPlayerToEl(player, objective)

          const distanceClaimZone = Utils.get2PosDistance( objective, objective.claimZone )
          if (14 > distanceClaimZone) {
            this.score += settings.TEAM_OBJECTIVE_SCORE
            objective.dead = true
            this.gameHasTeamObjective = false
          }
        }
      })
    }
  }

  updateGameboard(delta) {
    if (this.isVictory()) {

      if (! this.victoryEmitted) {
        this.killAllNonPlayers()
      }

      this.updateAllPlayers(delta)
      this.emitUpdateToClients()


      if (! this.victoryEmitted) {
        this.deleteDeadEnemies()
        deleteDeadObjectives()
        deleteDeadTeamObjectives()

        this.emitVictoryToClients()
      }

      this.newGameStartPressure++
      if (settings.FPMS * 10 < this.newGameStartPressure) {
        this.startNewGame()
      }

      // BAIL. No need for the rest since they won!
      return
    }

    ///// DEBUG TEST
    // this.score += 0.2

    if (! this.skipSomeChecksThisLoop) {

      this.checkSafeY()

      checkObjectivesGestation(this.playerCount)


      if (! this.gameHasTeamObjective && 10 <= this.score) {
        this.gameHasTeamObjective = true
        createTeamObjective()
      }

      this.checkEnemiesGestation()
      this.checkCollisions(delta)
      this.updateEnemies(delta)
    }

    this.updateAllPlayers(delta)

    this.emitUpdateToClients()

    if (! this.skipSomeChecksThisLoop) {
      this.deleteDeadEnemies()
      deleteDeadObjectives()
      deleteDeadTeamObjectives()
    }

    this.skipSomeChecksThisLoop = ! this.skipSomeChecksThisLoop
  }

  killAllNonPlayers() {
    const objectives = getObjectives()
    const teamObjectives = getTeamObjectives()

    ///// ENNEMIES
    this.enemies.forEach(enemy => {
      enemy.dead = true
    })

    ///// OBJECTIVES
    objectives.forEach(objective => {
      objective.dead = true
    })

    ///// TEAM OBJECTIVES
    teamObjectives.forEach(objective => {
      objective.dead = true
    })
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

  startNewGame() {
    console.log( 'NEW GAME' );
    this.victoryEmitted = false
    this.score = 0
    this.newGameStartPressure = 0
    this.gameHasTeamObjective = false
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

    player.goalPos = this.makePlayerCoordValid(goalPos)
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

    const { x, y } = this.makePlayerCoordValid(goalPos)

    player.x = x
    player.y = y
    player.goalPos = goalPos
  }

  makePlayerCoordValid(coord) {
    if (0 > coord.x) {
      coord.x = 0
    } else if (this.playgroundWidth < coord.x) {
      coord.x = this.playgroundWidth
    }

    if (0 > coord.y) {
      coord.y = 0
    } else if (this.playgroundHeight < coord.y) {
      coord.y = this.playgroundHeight
    }

    return coord
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
      const { id, x, y, goalPos, velocity, color, dead, currentAction, linksToEls } = this.players[player]
      playersParams.push({
        id,
        x,
        y,
        color,
        goalPos,
        velocity, // Pixels by ms
        dead,
        currentAction,
        linksToEls,
      })
    }
    return playersParams
  }

  linkPlayerToEl(player, el) {
    player.linksToEls.push({
      id: el.id,
      type: el.type,
    })
  }

  resetPlayerLinks(player) {
    player.linksToEls = []
  }

  removePlayerLink(player, type, id) {
    player.linksToEls.forEach((el, index) => {
      if (id === el.id && type === el.type) {
        delete el[index]
      }
    })
  }


  ////////// ENEMIES
  checkEnemiesGestation() {
    this.enemyGestatingPressure += Math.min(settings.FPMS * 4, this.score)

    // Entamer la création d'enemies si ce n'est pas déjà en cours.
    // if (250 > this.enemyGestatingPressure) { // TEST DEBUG
    if (1000 > this.enemyGestatingPressure) {
      // BAIL. Still not enough pressure.
      return
    }

    this.enemyGestatingPressure = 0

    let size = 0
    if (10 > this.score) {
      size = Math.floor(Math.random() * 100) + 30
    } else if (30 > this.score) {
      size = Math.floor(Math.random() * 150) + 30
    } else if (50 > this.score) {
      size = Math.floor(Math.random() * 200) + 30
    } else if (100 > this.score) {
      size = Math.floor(Math.random() * 220) + 50
    } else {
      size = Math.floor(Math.random() * 230) + this.score / 2
    }


    let y = Math.floor(Math.random() * this.playgroundHeight) - size / 2
    let goalY = y
    if (this.isDiagonalEnemy()) {
      goalY = Math.floor(Math.random() * this.playgroundHeight) - size / 2

    } else if (
      goalY <= this.safeY + this.safeYHeight &&
      goalY + size >= this.safeY
    ) {
      // It is too close to the safe path. Offset it a little.
      const diff = goalY + size - this.safeY
      if (0 > diff) {
        goalY = this.safeY - this.safeYHeight - size
      } else {
        goalY = this.safeY + this.safeYHeight
      }

      // Still go in a straight line.
      y = goalY
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
      velocity: Math.max(80, 650 - size * 5) + Math.min(250, this.score) + Math.random() * 50, // Pixels by ms
      size: size,
      dead: false,
    })
  }

  updateEnemies(delta) {
    this.enemies.forEach(enemy => {
      enemy.dead = this.moveElement(enemy, delta)
    })
  }

  deleteDeadEnemies() {
    for(let index = this.enemies.length - 1; 0 <= index; index--) {
      if (this.enemies[index].dead) {
        this.enemies.splice(index, 1)
      }
    }
  }

  isDiagonalEnemy() {
    return (this.score - 100) * 100 / settings.VICTORY_SCORE / 100 > Math.random()
  }

  ///// SAFE Y
  checkSafeY() {
    if (this.isNewSafeYGoalNeeded()) {
      this.createNewMoveSafeYGoal()
    }

    if (this.safeY !== this.safeYGoal) {
      const dist = this.safeY - this.safeYGoal
      if (Math.abs(dist) < this.safeYVelocity) {
        this.safeY = this.safeYGoal
      } else {
        this.safeY += 0 < dist ? -this.safeYVelocity : this.safeYVelocity
      }
    }
  }

  isNewSafeYGoalNeeded() {
    return 0.005 > Math.random()
  }

  createNewMoveSafeYGoal() {
    this.safeYGoal = Math.floor(Math.random() * this.playgroundHeight)
  }

  ///// VICTORY
  isVictory() {
    return settings.VICTORY_SCORE <= this.score
  }

  emitVictoryToClients() {
    console.log('VICTORY!!!');

    this.victoryEmitted = true

    /**
     * @todo Add a MVP to the data.
     */
    global.io.emit('victory', {})
  }
}

module.exports = Game