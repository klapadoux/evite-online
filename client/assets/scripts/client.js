import Player from './player.js'
import Enemy from './enemy.js'

(() => {
  const sock = io()
  
  let thisPlayer
  const playersOnBoard = {}
  const enemiesOnBoard = {}
  const playground = document.getElementById('playground')
  
  
  const addPlayerToGame = (player) => {
    playground.append(player.node)
    playersOnBoard[player.color] = player
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
  
  /**
   * @param {object} enemyArgs - Contains the basic to create and/or move an enemy.
   */
  const updateEnemy = (enemyArgs) => {
    const {id} = enemyArgs
    if ( 'undefined' === typeof enemiesOnBoard[id] ) {
      addEnemyToGame(new Enemy(enemyArgs))
    } else {
      enemiesOnBoard[id].update(enemyArgs)
    }
  }
  
  
  sock.on('init_player', args => {
    thisPlayer = new Player(args)
    addPlayerToGame(thisPlayer)
  })
  
  sock.on('mousemove', playerArgs => {
    if ( 'undefined' === typeof playersOnBoard[playerArgs.color] ) {
      addPlayerToGame(new Player(playerArgs))
    }
    
    playersOnBoard[playerArgs.color].moveTo(playerArgs) 
  })
  
  sock.on('player_disconnect', playerColor => {
    removePlayerFromGame(getPlayerByColor(playerColor))
  })
  
  sock.on('tick_update', tickInfo => {
    const {enemies} = tickInfo
    
    enemies.forEach(enemy => {
      if ( enemy.dead ) {
        console.log( 'LE TUER' );
      }
      updateEnemy(enemy)
    })
  })
  
  window.addEventListener('mousemove', event => {
    thisPlayer.x = event.pageX
    thisPlayer.y = event.pageY
    
    sock.emit('mousemove', thisPlayer.getEmitParams())
  })
})()