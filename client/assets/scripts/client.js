import Player from './player.js'
import Enemy from './enemy.js'

(() => {
  const sock = io()
  
  let thisPlayer
  const playersOnBoard = {}
  const enemiesOnBoard = {}
  const playground = document.getElementById('playground')
  
  const isThisOurPlayer = (player) => {
    return thisPlayer.color === player.color
  }
  
  const doEventMouseMove = (event) => {
    thisPlayer.x = event.pageX
    thisPlayer.y = event.pageY
    sock.emit('mousemove', {
      x: thisPlayer.x,
      y: thisPlayer.y,
      color: thisPlayer.color,
    })
  }
  
  const addPlayerToGame = (player) => {
    playground.append(player.node)
    playersOnBoard[player.color] = player
    
    window.addEventListener('mousemove', doEventMouseMove)
  }
  
  const killPlayer = (player) => {
    player.die()
    window.removeEventListener('mousemove', doEventMouseMove)
    
    if (isThisOurPlayer(player)) {
      setTimeout(() => {
        window.addEventListener('click', resurrectPlayer)
      }, 3000);
    }
  }
  
  const resurrectPlayer = (player) => {
    player.resurrect()
    window.removeEventListener('click', resurrectPlayer)
    window.addEventListener('mousemove', doEventMouseMove)
  }
  
  const addEnemyToGame = (enemy) => {
    playground.append(enemy.node)
    enemiesOnBoard[enemy.id] = enemy
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
  
  const getEnemyById = (id) => {
    if ('undefined' !== typeof enemiesOnBoard[id]) {
      return enemiesOnBoard[id]
    }
    
    return null
  }
  
  const removeEnemyFromGame = (enemy) => {
    if (enemy) {
      enemy.node.remove()
      delete enemiesOnBoard[enemy.id]
    }
  }
  
  /**
   * @param {object} enemyArgs - Contains the basic to create and/or move an enemy.
   */
  const updateEnemy = (enemyArgs) => {
    const {id} = enemyArgs
    if ('undefined' === typeof enemiesOnBoard[id]) {
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
  
  sock.on('init_player', args => {
    thisPlayer = new Player(args)
    addPlayerToGame(thisPlayer)
  })
  
  sock.on('player_death', color => {
    killPlayer(getPlayerByColor(color))
  })
  
  sock.on('mousemove', playerArgs => {
    if ('undefined' !== typeof playersOnBoard[playerArgs.color] ) {
      playersOnBoard[playerArgs.color].moveTo(playerArgs)
    } else {
      addPlayerToGame(new Player(playerArgs))
      // playersOnBoard[playerArgs.color].moveTo(playerArgs)
    }
  })
  
  sock.on('player_disconnect', playerColor => {
    removePlayerFromGame(getPlayerByColor(playerColor))
  })
  
  sock.on('tick_update', tickInfo => {
    const {enemies} = tickInfo
    enemies.forEach(enemyData => {
      if (enemyData.dead) {
        deleteEnemy(enemyData)
      } else {
        updateEnemy(enemyData)
      }
    })
  })
})()