const Game = require('./server/game')
const { createPlayer } = require('./server/player')

class Gameroom {
  constructor() {
    this.players = {}
    this.game = null
    
    this.newGame()
  }
  
  newGame() {
    this.game = new Game()
  }
  
  addUserByID(userID) {
    this.createPlayerFromUserID(userID)
  }
  
  createPlayerFromUserID(userID) {
    if ('undefined' !== typeof this.players[userID]) {
      // BAIL if this user already exist.
      return
    }
    
    const user = global.getUserByID(userID)
    
    if (! user) {
      // BAIL if this user doesn't exist.
      return
    }
    
    // Register the User as a new player
    this.players[userID] = createPlayer(user)
    
    const { socket } = user
    
    // Tell this user that it has now become a player.
    socket.emit('init_this_connection', this.game.players[socket.id])
  
  
    ///// Socket ON events for the game.
    
    socket.on('mousemove', playerParams => {
      this.game.updatePlayer(playerParams)
    })
    
    socket.on('player_resurrect', playerParams => {
      this.game.updatePlayer(playerParams, true)
      global.io.emit('player_resurrect', playerParams.color)
    })
    
    socket.on('disconnect', reason => {
      const colorIndex = usedColors.indexOf(this.game.players[socket.id].color)
      if (-1 < colorIndex) {
        usedColors.splice(colorIndex, 1)
      }
      console.log(`Player ${this.game.players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason, usedColors);
      global.io.emit('player_disconnect', this.game.players[socket.id].color)
      delete this.game.players[socket.id]

      this.game.stopGameloopIfNeeded()
    })
    
    this.game.startGameloopIfNeeded()
  }
}