import Player from './class-player.js'

(() => {
  const sock = io()
  
  let thisPlayer
  const players = {}
  const playground = document.getElementById('playground')
  
  
  const addPlayerToGame = (player) => {
    playground.append(player.node)
    players[player.color] = player
  }
  
  const removePlayerFromGame = (player) => {
    if (player) {
      console.log( `Player with color ${player.color} has been removed.`, players )
      player.node.remove()
      delete players[player.color]
    }
  }
  
  const getPlayerByColor = (playerColor) => {
    if ( 'undefined' !== typeof players[playerColor] ) {
      return players[playerColor]
    }
    
    return null
  }
  
  
  sock.on('init_player', args => {
    thisPlayer = new Player(args)
    addPlayerToGame(thisPlayer)
  })
  
  sock.on('mousemove', playerArgs => {
    if ( 'undefined' === typeof players[playerArgs.color] ) {
      addPlayerToGame(new Player(playerArgs))
    }
    
    players[playerArgs.color].moveTo(playerArgs) 
  })
  
  sock.on('player_disconnect', playerColor => {
    removePlayerFromGame(getPlayerByColor(playerColor))
  })
  
  window.addEventListener('mousemove', event => {
    thisPlayer.x = event.pageX
    thisPlayer.y = event.pageY
    
    sock.emit('mousemove', thisPlayer.getEmitParams())
  })
})()