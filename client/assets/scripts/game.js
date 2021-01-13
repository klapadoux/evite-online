import Utils from './utils.js'
import DebugCanvas from './debug-canvas.js'
import Player from './player.js'
import Enemy from './enemy.js'
import Objective from './objective.js'
import * as Settings from './settings.js'

const PREPARED_ENEMIES_BODY_MAX_COUNT = 10
const COLORS = [
  '#e91b53',
  '#be40d9',
  '#e9ad54',
]

class Game {
  constructor(socket, ourPlayer) {
    this.socket = socket
    this.ourPlayer = ourPlayer
    
    this.players = {}
    this.enemies = {}
    this.objectives = {}
    this.enemiesBodyOnHold = []
    this.cleanupList = []
    this.playground = document.getElementById('playground')
    this.scoreCounters = document.querySelectorAll('.score-counter')
    
    this.enemyBodyBirthCount = 0
    this.actualScore = 0
    
    this.activeColorIndex = COLORS.length - 1
    
    this.initHandlers()
    this.initSocketEvents()
    this.addPlayerToGame(this.ourPlayer)
    this.refillWithPreparedEnemiesBody()
    
    window.requestAnimationFrame(this.doAnimationLoopHandler)
  }
  
  initSocketEvents() {
    this.socket.on('player_death', playerId => {
      this.killPlayer(this.getPlayerById(playerId))
    })
    
    this.socket.on('player_resurrect', playerId => {
      this.resurrectPlayer(this.getPlayerById(playerId))
    })
    
    this.socket.on('player_disconnect', playerId => {
      this.removePlayerFromGame(this.getPlayerById(playerId))
    })
    
    this.socket.on('tick_update', tickInfo => {
      const { enemies, players, objectives, score } = tickInfo
      
      players.forEach(playerData => {
        this.updatePlayer(playerData)
      })
      
      enemies.forEach(enemyData => {
        if (enemyData.dead) {
          this.deleteEnemy(enemyData)
        } else {
          this.updateEnemy(enemyData)
        }
      })
      
      objectives.forEach(objectiveData => {
        if (objectiveData.dead) {
          this.deleteObjective(objectiveData)
        } else {
          this.updateObjective(objectiveData)
        }
      })
      
      this.updateScoreCounters(score)
    })
    
    /**
     * For Debug.
     */
    if (Settings.SHOW_SPAWN_RECT) {
      this.socket.on('display_spawning_rect', rect => {
        DebugCanvas.drawRect(rect)
      })
    }
  }
  initHandlers() {
  
    this.resurrectOurPlayerHandler = this.resurrectOurPlayer.bind(this)
    this.doEventMouseMoveHandler = this.doEventMouseMove.bind(this)
    this.doAnimationLoopHandler = this.doAnimationLoop.bind(this)
  }
  
  doAnimationLoop() {
    this.changeActiveColor()
    
    // Change color for enemies
    for (const enemy in this.enemies) {
      this.enemies[enemy].node.style.backgroundColor = this.getActiveColor()
    }
    
    // Also change color for prepred bodies.
    this.enemiesBodyOnHold.forEach((enemyBody, index) => {
      enemyBody.style.backgroundColor = this.getActiveColor()
      
      if (Settings.SHOW_PREPARED_ENEMIES_BODY) {
        enemyBody.style.transform = `translate3d(${index * 101}px, 0, 0)`
        enemyBody.style.width = '100px'
        enemyBody.style.height = '100px'
      }
    })
    
    // Do this again later.
    setTimeout(() => {
      window.requestAnimationFrame(this.doAnimationLoopHandler)
    }, 5000);
  }
  
  addNodeToCleanupList(node) {
    this.cleanupList.push(node)
    if (200 < this.cleanupList.length) {
      const nodeToBeCleaned = this.cleanupList.shift()
      if (nodeToBeCleaned) {
        nodeToBeCleaned.style.opacity = 0
        // Let time for CSS animation before removing it.
        setTimeout(function(){
          this.remove()
        }.bind(nodeToBeCleaned), 500)
      }
    }
  }
  
  isThisOurPlayer(player) {
    return this.ourPlayer.id === player.id
  }
  
  doEventMouseMove(event) {
    this.ourPlayer.goalPos.x = event.pageX
    this.ourPlayer.goalPos.y = event.pageY
    this.socket.emit('mousemove', this.ourPlayer.getEmitParams())
  }
  
  updateScoreCounters(score) {
    if (this.actualScore === score) {
      return;
    }
    this.scoreCounters.forEach(counter => {
      counter.innerHTML = score
    })
  }
  
  addBloodUnderElement(element, sizeType = 'same', delay = 0) {
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    // ICICICIICICICIICICICIICICI
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    
    
    console.log( 'BLOOD IN', delay );
    setTimeout(((bloodiedElement) => {
      console.log( bloodiedElement );
      
      const { node, size } = bloodiedElement
      const { x, y } = node.getBoundingClientRect()
      
      let bloodSize = size
      let sizeVariance = 0.33
      switch (sizeType) {
        case 'small':
          bloodSize = size / 5
          break
        case 'medium':
          bloodSize = size / 3
          sizeVariance = 0.2
          break
      }
      
      const bloodWidth = Math.floor(Math.random() * bloodSize + bloodSize * sizeVariance)
      const bloodHeight = Math.floor(Math.random() * bloodSize + bloodSize * sizeVariance)
      const bloodCoord = Utils.getRandomCoordInRect(
        x + bloodWidth / 2,
        y + bloodHeight / 2,
        size - bloodWidth / 2,
        size - bloodHeight / 2
      )
      // TEST POINT
      // let point = document.createElement('div')
      // point.classList.add('test-center')
      // point.style.left = bloodX + 'px'
      // point.style.top = bloodY + 'px'
      // playground.append(point)
      
      let blood = document.createElement('span')
      blood.style.left = bloodCoord.x + 'px'
      blood.style.top = bloodCoord.y + 'px'
      blood.style.width = bloodWidth + 'px'
      blood.style.height = bloodHeight + 'px'
      blood.classList.add('blood', `blood--${sizeType}`)
      this.playground.append(blood)
      this.addNodeToCleanupList(blood)
    })(element), delay)
  }
  
  
  
  ////////// PLAYERS
  
  addPlayerToGame(player) {
    this.playground.append(player.node)
    this.players[player.id] = player
    
    console.log( 'playersOnBoard', this.players );
    
    if (player.dead) {
      this.killPlayer(player)
    }
    
    if (this.isThisOurPlayer(player)) {
      window.addEventListener('mousemove', this.doEventMouseMove.bind(this))
    } else {
      console.log( player );
    }
  }
  
  killPlayer(player) {
    if (! player) {
      // BAIL if that player no longer exist
      return false;
    }
    
    const bloodCount = Math.floor(Math.random() * 5)
    const bloodTypes = ['small', 'medium']
    for (let i = 0; i <= bloodCount; i++) {
      const type = bloodTypes[Math.floor(Math.random() * bloodTypes.length)]
      const delay = Math.random() * 600
      this.addBloodUnderElement(player, type, delay)
    }
    this.addBloodUnderElement(player, 'same', 625)
    this.addBloodUnderElement(player, 'same', 650)
    
    player.die()
    this.addNodeToCleanupList(player.node)
    
    if (this.isThisOurPlayer(player)) {
      window.removeEventListener('mousemove', this.doEventMouseMoveHandler)

      setTimeout(() => {
        window.addEventListener('click', this.resurrectOurPlayerHandler)
      }, 1000)
    }
  }
  
  resurrectPlayer(player) {
    if (! player) {
      // BAIL if that player no longer exist
      return false;
    }
    
    player.resurrect()
    this.addPlayerToGame(player)
    if (this.isThisOurPlayer(player)) {
      window.removeEventListener('click', this.resurrectOurPlayerHandler)
      window.addEventListener('mousemove', this.doEventMouseMoveHandler)
    }
  }
  
  resurrectOurPlayer(event) {
    this.ourPlayer.x = event.pageX
    this.ourPlayer.y = event.pageY
    this.ourPlayer.goalPos.x = event.pageX
    this.ourPlayer.goalPos.y = event.pageY
    this.ourPlayer.velocity = this.ourPlayer.defaultVelocity
    this.socket.emit('player_resurrect', this.ourPlayer.getEmitParams())
  }
  
  removePlayerFromGame(player) {
    if (player) {
      console.log( `Player with id ${player.id} has been removed.`, this.players )
      player.node.remove()
      delete this.players[player.id]
    }
  }
  
  getPlayerById(playerId) {
    if ( 'undefined' !== typeof this.players[playerId] ) {
      return this.players[playerId]
    }
    
    return null
  }
  
  updatePlayer(playerArgs) {
    const player = this.getPlayerById(playerArgs.id)
    if (player) {
      player.moveTo(playerArgs)
    } else {
      console.log( 'Update an Unknown player', playerArgs );
      this.addPlayerToGame(new Player(playerArgs))
    }
  }
  
  
  
  ////////// ENEMIES
  
  getEnemyById(id) {
    if ('undefined' !== typeof this.enemies[id]) {
      return this.enemies[id]
    }
    
    return null
  }
  
  addEnemyToGame(enemy) {
    if (enemy.needToAppendMainNode) {
      this.playground.append(enemy.node)
    }
    this.playground.append(enemy.shadowNode)
    this.enemies[enemy.id] = enemy
    this.prepareNewEnemyBody()
  }
  
  updateEnemy(enemyArgs) {
    const { id } = enemyArgs
    if ('undefined' === typeof this.enemies[id]) {
      if (this.enemiesBodyOnHold.length) {
        enemyArgs.node = this.enemiesBodyOnHold.shift()
      }
      this.addEnemyToGame(new Enemy(enemyArgs))
    } else {
      this.enemies[id].update(enemyArgs)
    }
  }
  
  deleteEnemy(enemyArgs) {
    const { id } = enemyArgs
    if ('undefined' !== typeof this.enemies[id]) {
      this.removeEnemyFromGame(this.getEnemyById(id))
    }
  }
  
  removeEnemyFromGame(enemy) {
    if (enemy) {
      enemy.die()
      delete this.enemies[enemy.id]
    }
  }
  
  refillWithPreparedEnemiesBody() {
    if (PREPARED_ENEMIES_BODY_MAX_COUNT > this.enemiesBodyOnHold.length) {
      for (let i = PREPARED_ENEMIES_BODY_MAX_COUNT - this.enemiesBodyOnHold.length; 0 < i; i--) {
        this.prepareNewEnemyBody()
      }
    }
  }
  
  prepareNewEnemyBody() {
    this.enemyBodyBirthCount++

    const newNode = Enemy.createNode()
    newNode.style.backgroundColor = this.getActiveColor()
    this.enemiesBodyOnHold.push(newNode)
    this.playground.append(newNode)
  }
  
  changeActiveColor() {
    this.activeColorIndex--
    if (0 > this.activeColorIndex) {
      this.activeColorIndex = COLORS.length - 1
    }
  }
  
  getActiveColor() {
    return COLORS[this.activeColorIndex]
  }
  
  
  
  ////////// OBJECTIVES
  
  getObjectiveById(id) {
    if ('undefined' !== typeof this.objectives[id]) {
      return this.objectives[id]
    }
    
    return null
  }
  
  addObjectiveToGame(objective) {
    this.playground.append(objective.node)
    this.objectives[objective.id] = objective
  }
  
  updateObjective(objectiveArgs) {
    const { id } = objectiveArgs
    if ('undefined' === typeof this.objectives[id]) {
      this.addObjectiveToGame(new Objective(objectiveArgs))
    } else {
      this.objectives[id].update(objectiveArgs)
    }
  }
  
  deleteObjective(objectiveArgs) {
    const { id } = objectiveArgs
    if ('undefined' !== typeof this.objectives[id]) {
      this.removeObjectiveFromGame(this.getObjectiveById(id))
    }
  }
  
  removeObjectiveFromGame(objective) {
    if (objective) {
      objective.node.remove()
      delete this.objectives[objective.id]
    }
  }
}

export default Game