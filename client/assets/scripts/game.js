import Utils from './utils.js'
import DebugCanvas from './debug-canvas.js'
import Playground from './playground.js'
import Player from './player.js'
import Enemy from './enemy.js'
import Objective from './objective.js'
import TeamObjective from './team-objective.js'
import * as settings from './settings.js'
import TextPop from './text-pop.js'

const PREPARED_ENEMIES_BODY_MAX_COUNT = 10
const COLORS = [
  '#e91b53',
  '#be40d9',
  '#e9ad54',
]

class Game {
  constructor(socket, gameArgs, ourPlayer) {
    this.socket = socket
    this.ourPlayer = ourPlayer

    this.players = {}
    this.enemies = {}
    this.objectives = {}
    this.teamObjectives = {}
    this.enemiesBodyOnHold = []
    this.cleanupList = []
    this.playground = new Playground(gameArgs)
    this.scoreCounters = document.querySelectorAll('.score-counter')

    this.enemyBodyBirthCount = 0
    this.actualScore = 0

    this.activeColorIndex = COLORS.length - 1

    this.showScoreText = true

    this.initHandlers()
    this.initSocketEvents()
    this.initUI()

    if (this.ourPlayer) {
      this.addPlayerToGame(this.ourPlayer)
    }

    this.refillWithPreparedEnemiesBody()

    if (settings.userSettings.objectTransition && settings.userSettings.objectAnimation) {
      window.requestAnimationFrame(this.doAnimationLoopHandler)
    }
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
      const { enemies, players, objectives, teamObjectives, score } = tickInfo

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

      teamObjectives.forEach(objectiveData => {
        if (objectiveData.dead) {
          this.deleteTeamObjective(objectiveData)
        } else {
          this.updateTeamObjective(objectiveData)
        }
      })

      this.updateScoreCounters(score)
    })

    this.socket.on('player_data', (data) => {
      const { id } = data
      const player = this.getPlayerById(id)
      if (player) {
        player.updateData(data)
      }
    })

    this.socket.on('victory', (data) => {
      this.showScoreText = false
      this.cleanGameboard()
      this.displayVictory()
      this.showScoreText = true
    })

    /**
     * For Debug.
     */
    if (settings.SHOW_SPAWN_RECT) {
      this.socket.on('display_spawning_rect', rect => {
        DebugCanvas.drawRect(rect)
      })
    }
  }

  initHandlers() {
    this.resurrectOurPlayerHandler = this.resurrectOurPlayer.bind(this)

    this.doEventMouseMoveHandler = this.doEventMouseMove.bind(this)
    this.doEventMouseDownHandler = this.doEventMouseDown.bind(this)

    this.teleportAtMouseUpHandler = this.teleportAtMouseUp.bind(this)

    this.doAnimationLoopHandler = this.doAnimationLoop.bind(this)
  }

  initUI() {
    this.scoreCounters.forEach(counter => {
      counter.querySelector('.objective-score').innerText = settings.VICTORY_SCORE
    })
  }

  doAnimationLoop() {
    this.changeActiveColor()

    // Change color for enemies
    for (const enemy in this.enemies) {
      this.enemies[enemy].node.style.backgroundColor = this.getActiveColor()
    }

    // Also change color for prepared bodies.
    this.enemiesBodyOnHold.forEach((enemyBody, index) => {
      enemyBody.style.backgroundColor = this.getActiveColor()

      if (settings.SHOW_PREPARED_ENEMIES_BODY) {
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
    return this.ourPlayer && this.ourPlayer.id === player.id
  }

  doEventMouseMove(event) {
    if ('charge_teleport' === this.ourPlayer.currentAction) {
      // BAIL. Teleporting, no need to report movement.
      return
    }

    this.ourPlayer.goalPos = this.convertPosToPlaygroundScale({ x: event.pageX, y: event.pageY })

    this.socket.emit('mousemove', this.getOurPlayerEmitParams())
  }

  doEventMouseDown() {
    this.ourPlayer.setCurrentAction('charge_teleport')
    window.addEventListener('mouseup', this.teleportAtMouseUpHandler)

    this.socket.emit('charge_teleport', this.getOurPlayerEmitParams())
  }

  getOurPlayerEmitParams() {
    return this.ourPlayer.getEmitParams()
  }

  convertPosToPlaygroundScale({ x, y }) {
    x = (x - this.playground.x) * this.playground.reverseScale
    y = (y - this.playground.y) * this.playground.reverseScale

    return { x, y }
  }

  teleportAtMouseUp(event) {
    const pos = this.convertPosToPlaygroundScale({
      x: event.pageX,
      y: event.pageY,
    })

    this.ourPlayer.teleportTo(pos)

    this.socket.emit('teleport_player_to', this.getOurPlayerEmitParams())

    setTimeout(() => {
      this.ourPlayer.setCurrentAction()
      window.removeEventListener('mouseup', this.teleportAtMouseUpHandler)
    }, 100)
  }

  updateScoreCounters(score) {
    if (this.actualScore === score) {
      return
    }

    this.actualScore = score

    this.scoreCounters.forEach(counter => {
      counter.querySelector('.score').innerText = score
    })

    this.playground.setBackgroundOpacity(1 - (score / 500 - 0.2))
  }

  addPlayerDeathBlood(player) {
    if (settings.userSettings.objectAnimation && settings.userSettings.corpse) {
      const bloodCount = Math.floor(Math.random() * 5)
      const bloodTypes = ['small', 'medium']
      for (let i = 0; i <= bloodCount; i++) {
        const type = bloodTypes[Math.floor(Math.random() * bloodTypes.length)]
        const delay = Math.random() * 600
        this.addBloodUnderElement(player, type, delay)
      }
      this.addBloodUnderElement(player, 'same', 625)
      this.addBloodUnderElement(player, 'same', 650)
    } else {
      this.addBloodUnderElement(player, 'same')
      this.addBloodUnderElement(player, 'same')
    }
  }

  addBloodUnderElement(element, sizeType = 'same', delay = 0) {
    setTimeout(() => {

      const { node, size } = element
      const { x, y } = this.convertPosToPlaygroundScale(node.getBoundingClientRect())


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
        size - bloodWidth,
        size - bloodHeight
      )

      // TEST POINT
      // Utils.addTestPoint(this.playground, bloodCoord)

      let blood = document.createElement('span')
      blood.style.left = bloodCoord.x + 'px'
      blood.style.top = bloodCoord.y + 'px'
      blood.style.width = bloodWidth + 'px'
      blood.style.height = bloodHeight + 'px'
      blood.classList.add('blood', `blood--${sizeType}`)
      this.playground.append(blood)
      this.addNodeToCleanupList(blood)
    }, delay)
  }

  createUniqueIdWith2Els(action, el1, el2) {
    return `${action}-${el1.type}-${el1.id}-${el2.type}-${el2.id}`
  }

  /**
   *
   * @param {object} el1 Object with properties id, size, x, y
   * @param {object} el2 Object with properties id, size, x, y
   * @returns {string} Created ID
   */
  updateElsLink(el1, el2) {
    const { x:elX, y:elY, size:elSize } = el1
    const { color = white } = el2
    const elCenterPos = {
      x: elX + elSize / 2,
      y: elY + elSize / 2,
    }
    const maxPullDistance = 300
    const distance = Utils.get2PosDistance(elCenterPos, el2)
    const elsId = this.createUniqueIdWith2Els('link', el1, el2)
    const deg = Utils.angleDeg(elCenterPos, el2) - 90

    let link = document.getElementById(elsId)
    if (! link) {
      link = document.createElement('div')
      link.id = elsId
      link.style.position = 'absolute'
      link.style.zIndex = '45'
      link.style.transformOrigin = `0 0`
      link.style.background = 'white'

      this.playground.append(link)
    }

    const linkWidth = (maxPullDistance - distance) / 30
    link.style.top = `${elY + elSize / 2}px`
    link.style.left = `${elX + elSize / 2 - linkWidth / 2}px`
    link.style.width = `${linkWidth}px`
    link.style.height = `${distance}px`
    link.style.transform = `rotate(${deg}deg)`
    link.style.boxShadow = `0 0 ${linkWidth}px ${color}`

    return elsId
  }

  cleanGameboard() {
    console.log('CLEAN GAMEBOARD');

    for (const enemy in this.enemies) {
      this.deleteEnemy(this.enemies[enemy])
    }

    for (const objective in this.objectives) {
      this.deleteObjective(this.objectives[objective])
    }

    for (const objective in this.teamObjectives) {
      this.deleteTeamObjective(this.teamObjectives[objective])
    }

    this.enemiesBodyOnHold.forEach((enemyBody, index) => {
      enemyBody.remove()
    })
    this.enemiesBodyOnHold = []
  }

  displayVictory() {
    const messageEl = document.getElementById('main-message')
    messageEl.querySelector('.main-message__inner').innerHTML = 'VICTOIRE !!!'
    messageEl.classList.add('active')
    setTimeout(() => {
      messageEl.classList.remove('active')
    }, 8000);
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
      this.addOurPlayerEvents()
    } else {
      console.log( player );
    }
  }

  killPlayer(player) {
    if (! player) {
      // BAIL if that player no longer exist
      return false;
    }

    if (this.showScoreText) {
      new TextPop({
        text: '-' + settings.PLAYER_DEATH_SCORE,
        type: 'player',
        x: player.x + player.size / 2,
        y: player.y + player.size / 2,
        parentNode: this.playground.node,
      })
    }

    player.die()

    if (settings.userSettings.blood) {
      this.addPlayerDeathBlood(player)
    }

    if (this.isThisOurPlayer(player)) {
      this.ourPlayer.setCurrentAction()
      this.removeOurPlayerEvents()

      setTimeout(() => {
        window.addEventListener('mousedown', this.resurrectOurPlayerHandler)
      }, 1000)
    }

    if (settings.userSettings.corpse) {
      this.addNodeToCleanupList(player.node)
    } else {
      // In case there is blood to be added, give it a little setTimeout.
      setTimeout(() => {
        player.node.remove()
      }, 1)
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
      window.removeEventListener('mousedown', this.resurrectOurPlayerHandler)
      this.addOurPlayerEvents()
    }
  }

  resurrectOurPlayer(event) {
    const { x, y } = this.convertPosToPlaygroundScale({ x: event.pageX, y: event.pageY })

    this.ourPlayer.x = x
    this.ourPlayer.y = y
    this.ourPlayer.goalPos.x = x
    this.ourPlayer.goalPos.y = y
    this.ourPlayer.velocity = this.ourPlayer.defaultVelocity
    this.socket.emit('player_resurrect', this.getOurPlayerEmitParams())
  }

  removePlayerFromGame(player) {
    if (player) {
      console.log( `Player with id ${player.id} has been removed.`, this.players )
      player.node.remove()
      delete this.players[player.id]
    }
  }

  addOurPlayerEvents() {
    window.addEventListener('mousemove', this.doEventMouseMoveHandler)
    window.addEventListener('mousedown', this.doEventMouseDownHandler)
  }

  removeOurPlayerEvents() {
    window.removeEventListener('mousemove', this.doEventMouseMoveHandler)
    window.removeEventListener('mousedown', this.doEventMouseDownHandler)

    // Disable events that might not be added just in case
    window.removeEventListener('mouseup', this.teleportAtMouseUpHandler)
  }

  getPlayerById(playerId) {
    if ( 'undefined' !== typeof this.players[playerId] ) {
      return this.players[playerId]
    }

    return null
  }

  addOurPlayer(player) {
    this.ourPlayer = player

    if ('undefined' === typeof this.players[player.id]) {
      this.addPlayerToGame(player)
    }
  }

  updatePlayer(playerArgs) {
    const player = this.getPlayerById(playerArgs.id)

    if (player) {
      player.update(playerArgs)
      this.applyPlayerLinksToEls(player)
    } else {
      console.log( 'Update an Unknown player', playerArgs );
      const newPlayer = new Player(playerArgs)
      this.addPlayerToGame(new Player(playerArgs))

      this.setOncePlayerDataFromServer(newPlayer)
    }
  }

  applyPlayerLinksToEls(player) {
    const newLinks = []
    player.linksToEls.forEach(el => {
      switch (el.type) {
        case 'teamObjective':
          if (this.teamObjectives[el.id]) {
            newLinks.push(this.updateElsLink(this.teamObjectives[el.id], player))
          }
            break
      }
    })

    // Verify stored links validity
    player.linksLookup.forEach(linkId => {
      if (! newLinks.some(newLinkId => linkId === newLinkId)) {
        const link = document.getElementById(linkId)
        if (link) {
          link.remove()
        }
      }
    })

    player.linksLookup = newLinks
  }

  setOncePlayerDataFromServer(player) {
    this.socket.emit('get_player_data_by_id', player.id)
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
    if (enemy.shadowNode) {
      this.playground.append(enemy.shadowNode)
    }
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
      if (this.showScoreText) {
        new TextPop({
          text: '+' + settings.OBJECTIVE_SCORE,
          type: 'objective',
          x: objective.x + objective.size / 2,
          y: objective.y + objective.size / 2,
          parentNode: this.playground.node,
        })
      }

      objective.node.remove()
      delete this.objectives[objective.id]
    }
  }



  ////////// TEAM OBJECTIVES

  getTeamObjectiveById(id) {
    if ('undefined' !== typeof this.teamObjectives[id]) {
      return this.teamObjectives[id]
    }

    return null
  }

  addTeamObjectiveToGame(objective) {
    this.playground.append(objective.node)
    this.teamObjectives[objective.id] = objective
  }

  updateTeamObjective(objectiveArgs) {
    const { id } = objectiveArgs
    if ('undefined' === typeof this.teamObjectives[id]) {
      this.addTeamObjectiveToGame(new TeamObjective(objectiveArgs))
    } else {
      this.teamObjectives[id].update(objectiveArgs)
    }
  }

  deleteTeamObjective(objectiveArgs) {
    const { id } = objectiveArgs
    if ('undefined' !== typeof this.teamObjectives[id]) {
      this.removeTeamObjectiveFromGame(this.getTeamObjectiveById(id))
    }
  }

  removeTeamObjectiveFromGame(objective) {
    if (objective) {
      if (this.showScoreText) {
        new TextPop({
          text: '+' + settings.TEAM_OBJECTIVE_SCORE,
          type: 'team-objective',
          x: objective.x + objective.size / 2,
          y: objective.y + objective.size / 2,
          parentNode: this.playground.node,
        })
      }

      objective.node.remove()
      objective.claimZoneNode.remove()
      delete this.teamObjectives[objective.id]
    }
  }
}

export default Game