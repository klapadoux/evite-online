import Game from './game.js'
import Player from './player.js'

const socket = io()  
const game = null

/**
 * This actual connection initialization.
 */
socket.on('init_this_connection', args => {
  const { game, player } = args
  const ourPlayer = new Player(player)
  console.log( 'This is you:', ourPlayer );
  new Game(socket, game, ourPlayer)
})