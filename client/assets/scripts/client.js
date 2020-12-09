import Utils from './utils.js'
import DebugCanvas from './debug-canvas.js'
import Player from './player.js'
import Enemy from './enemy.js'
import Objective from './objective.js'
import * as Settings from './settings.js'

(() => {
  const sock = io()
  
  let thisPlayer
  const playersOnBoard = {}
  const enemiesOnBoard = {}
  const enemiesBodyOnHold = []
  const objectivesOnBoard = {}
  const cleanupList = []
  const playground = document.getElementById('playground')
  const scoreCounters = document.querySelectorAll('.score-counter')
  const PREPARED_ENEMIES_BODY_MAX_COUNT = 10
  
  let bodyId = 0
  
  let actualScore = 0
  
  const colors = [
    '#e91b53',
    '#be40d9',
    '#e9ad54',
  ]
  let activeColorIndex = colors.length - 1
  
  
  const addNodeToCleanupList = (node) => {
    cleanupList.push(node)
    if (200 < cleanupList.length) {
      const nodeToBeCleaned = cleanupList.shift()
      if (nodeToBeCleaned) {
        nodeToBeCleaned.style.opacity = 0
        // Let time for CSS animation before removing it.
        setTimeout(function(){
          this.remove()
        }.bind(nodeToBeCleaned), 500)
      }
    }
  }
  
  const isThisOurPlayer = (player) => {
    return thisPlayer.color === player.color
  }
  
  const doEventMouseMove = (event) => {
    thisPlayer.goalPos.x = event.pageX
    thisPlayer.goalPos.y = event.pageY
    sock.emit('mousemove', thisPlayer.getEmitParams())
  }
  
  const addPlayerToGame = (player) => {
    playground.append(player.node)
    playersOnBoard[player.color] = player
    
    if (player.dead) {
      killPlayer(player)
    }
    
    if (isThisOurPlayer(player)) {
      window.addEventListener('mousemove', doEventMouseMove)
    }
  }
  
  const killPlayer = (player) => {
    if (! player) {
      // BAIL if that player no longer exist
      return false;
    }
    
    const bloodCount = Math.floor(Math.random() * 5)
    const bloodTypes = ['small', 'medium']
    for (let i = 0; i <= bloodCount; i++) {
      const type = bloodTypes[Math.floor(Math.random() * bloodTypes.length)]
      const delay = Math.random() * 600
      addBloodUnderElement(player, type, delay)
    }
    addBloodUnderElement(player, 'same', 625)
    addBloodUnderElement(player, 'same', 650)
    
    player.die()
    addNodeToCleanupList(player.node)
    
    if (isThisOurPlayer(player)) {
      window.removeEventListener('mousemove', doEventMouseMove)
      
      if (isThisOurPlayer(player)) {
        setTimeout(() => {
          window.addEventListener('click', resurrectThisPlayer)
        }, 1000);
      }
    }
  }
  
  const resurrectPlayer = (player) => {
    if (! player) {
      // BAIL if that player no longer exist
      return false;
    }
    
    player.resurrect()
    addPlayerToGame(player)
    if (isThisOurPlayer(player)) {
      window.removeEventListener('click', resurrectThisPlayer)
      window.addEventListener('mousemove', doEventMouseMove)
    }
  }
  
  const resurrectThisPlayer = (event) => {
    thisPlayer.x = event.pageX
    thisPlayer.y = event.pageY
    thisPlayer.goalPos.x = event.pageX
    thisPlayer.goalPos.y = event.pageY
    thisPlayer.velocity = thisPlayer.defaultVelocity
    sock.emit('player_resurrect', thisPlayer.getEmitParams())
  }
  
  const removePlayerFromGame = (player) => {
    if (player) {
      console.log( `Player with color ${player.color} has been removed.`, playersOnBoard )
      player.node.remove()
      delete playersOnBoard[player.color]
    }
  }
  
  const getPlayerByColor = (playerColor) => {
    if ( 'undefined' !== typeof playersOnBoard[playerColor] ) {
      return playersOnBoard[playerColor]
    }
    
    return null
  }
  
  const updatePlayer = (playerArgs) => {
    const player = getPlayerByColor(playerArgs.color)
    if (player) {
      player.moveTo(playerArgs)
    } else {
      addPlayerToGame(new Player(playerArgs))
    }
  }
  
  const getEnemyById = (id) => {
    if ('undefined' !== typeof enemiesOnBoard[id]) {
      return enemiesOnBoard[id]
    }
    
    return null
  }
  
  const addEnemyToGame = (enemy) => {
    if (enemy.needToAppendMainNode) {
      playground.append(enemy.node)
    }
    playground.append(enemy.shadowNode)
    enemiesOnBoard[enemy.id] = enemy
    prepareNewEnemyBody()
  }
  
  const updateEnemy = (enemyArgs) => {
    const {id} = enemyArgs
    if ('undefined' === typeof enemiesOnBoard[id]) {
      if (enemiesBodyOnHold.length) {
        enemyArgs.node = enemiesBodyOnHold.shift()
      }
      addEnemyToGame(new Enemy(enemyArgs))
    } else {
      enemiesOnBoard[id].update(enemyArgs)
    }
  }
  
  const deleteEnemy = (enemyArgs) => {
    const {id} = enemyArgs
    if ('undefined' !== typeof enemiesOnBoard[id]) {
      removeEnemyFromGame(getEnemyById(id))
    }
  }
  
  const removeEnemyFromGame = (enemy) => {
    if (enemy) {
      enemy.die()
      delete enemiesOnBoard[enemy.id]
    }
  }
  
  const refillWithprepareEnemiesBody = () => {
    if (PREPARED_ENEMIES_BODY_MAX_COUNT > enemiesBodyOnHold.length) {
      for (let i = PREPARED_ENEMIES_BODY_MAX_COUNT - enemiesBodyOnHold.length; 0 < i; i--) {
        prepareNewEnemyBody()
      }
    }
  }
  
  const prepareNewEnemyBody = () => {
    bodyId++
    
    const newNode = Enemy.createNode()
    enemiesBodyOnHold.push(newNode)
    newNode.style.backgroundColor = getActiveColor()
    playground.append(newNode)
  }
  
  const getObjectiveById = (id) => {
    if ('undefined' !== typeof objectivesOnBoard[id]) {
      return objectivesOnBoard[id]
    }
    
    return null
  }
  
  const addObjectiveToGame = (objective) => {
    playground.append(objective.node)
    objectivesOnBoard[objective.id] = objective
  }

  const updateObjective = (objectiveArgs) => {
    const {id} = objectiveArgs
    if ('undefined' === typeof objectivesOnBoard[id]) {
      addObjectiveToGame(new Objective(objectiveArgs))
    } else {
      objectivesOnBoard[id].update(objectiveArgs)
    }
  }
  
  const deleteObjective = (objectiveArgs) => {
    const {id} = objectiveArgs
    if ('undefined' !== typeof objectivesOnBoard[id]) {
      removeObjectiveFromGame(getObjectiveById(id))
    }
  }
  
  const removeObjectiveFromGame = (objective) => {
    if (objective) {
      objective.node.remove()
      delete objectivesOnBoard[objective.id]
    }
  }
  
  
  const updateScoreCounters = (score) => {
    if (actualScore === score ) {
      return;
    }
    scoreCounters.forEach(counter => {
      counter.innerHTML = score
    })
  }
  
  const addBloodUnderElement = (element, sizeType = 'same', delay = 0) => {
    setTimeout(function () {
      const {node, size} = this
      const {x, y} = node.getBoundingClientRect()
      
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
      const bloodX = x - bloodWidth / 2 + size / 2 + Math.floor(Math.random() * size / 2) - size / 4
      const bloodY = y - bloodHeight / 2 + size / 2 + Math.floor(Math.random() * size / 2) - size / 4
      
      // TEST POINT
      // let point = document.createElement('div')
      // point.classList.add('test-center')
      // point.style.left = bloodX + 'px'
      // point.style.top = bloodY + 'px'
      // playground.append(point)
      
      let blood = document.createElement('span')
      blood.style.left = bloodX + 'px'
      blood.style.top = bloodY + 'px'
      blood.style.width = bloodWidth + 'px'
      blood.style.height = bloodHeight + 'px'
      blood.classList.add('blood', `blood--${sizeType}`)
      playground.append(blood)
      addNodeToCleanupList(blood)
    }.bind(element), delay);
  }
  
  const changeActiveColor = () => {
    activeColorIndex--
    if (0 > activeColorIndex) {
      activeColorIndex = colors.length - 1
    }
  }
  
  const getActiveColor = () => {
    return colors[activeColorIndex]
  }
  
  /**
   * For now, it's a simple loop.
   * What it does :
   *   - Each 5s, change color of enemies.
   */
  const doAnimationLoop = () => {
    changeActiveColor()
    
    // Change color for enemies
    for (const enemy in enemiesOnBoard) {
      enemiesOnBoard[enemy].node.style.backgroundColor = getActiveColor()
    }
    
    // Also change color for prepred bodies.
    enemiesBodyOnHold.forEach((enemyBody, index) => {
      enemyBody.style.backgroundColor = getActiveColor()
      
      if (Settings.SHOW_PREPARED_ENEMIES_BODY) {
        enemyBody.style.transform = `translate3d(${index * 101}px, 0, 0)`
        enemyBody.style.width = '100px'
        enemyBody.style.height = '100px'
      }
    })
    
    // Do this again later.
    setTimeout(() => {
      window.requestAnimationFrame(doAnimationLoop)
    }, 5000);
  }
  window.requestAnimationFrame(doAnimationLoop)
  
  
  /**
   * This actual connection initialization.
   */
  sock.on('init_this_connection', args => {
    thisPlayer = new Player(args)
    addPlayerToGame(thisPlayer)
    refillWithprepareEnemiesBody()
  })
  
  sock.on('player_death', color => {
    killPlayer(getPlayerByColor(color))
  })
  
  sock.on('player_resurrect', playerColor => {
    resurrectPlayer(getPlayerByColor(playerColor))
  })
  
  sock.on('player_disconnect', playerColor => {
    removePlayerFromGame(getPlayerByColor(playerColor))
  })
  
  sock.on('tick_update', tickInfo => {
    const {enemies, players, objectives, score} = tickInfo
    
    players.forEach(playerData => {
      updatePlayer(playerData)
    })
    
    enemies.forEach(enemyData => {
      if (enemyData.dead) {
        deleteEnemy(enemyData)
      } else {
        updateEnemy(enemyData)
      }
    })
    
    objectives.forEach(objectiveData => {
      if (objectiveData.dead) {
        deleteObjective(objectiveData)
      } else {
        updateObjective(objectiveData)
      }
    })
    
    updateScoreCounters(score)
  })
  
  sock.on('display_spawning_rect', rect => {
    DebugCanvas.drawRect(rect)
  })
})()