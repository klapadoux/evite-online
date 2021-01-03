const Game = require('./game')
const { createPlayer } = require('./player')
const randomColor = require('randomcolor')

class Gameroom {
  constructor() {
    this.users = {}
    this.game = null
    
    this.usedColors = []
    
    this.newGame()
  }
  
  newGame() {
    this.game = new Game()
  }
  
  addUserByID(userID) {
    if ('undefined' !== typeof this.users[userID]) {
      // BAIL if this user already exist.
      return
    }
    
    const user = global.getUserByID(userID)
    
    if (! user) {
      // BAIL if this user doesn't exist.
      return
    }
    
    // Register this gameroom for the user.
    this.users[userID] = user
    user.setGameroom(this)
    
    this.addUserToGame(user)
  }
  
  addUserToGame(user) {
    console.log( `Adding user ID "${user.id}" to game` );
    
    // Register the User as a new player
    const player = createPlayer({
      id: user.id,
      pseudo: user.pseudo,
      color: this.getUniqueRandomColor(),
    })
    
    this.game.addPlayer(player)
    
    
    // Tell this user that it has now become a player.
    user.socket.emit('init_this_connection', player)
  
  
    ///// Socket ON events for the game.
    
    user.socket.on('mousemove', playerParams => {
      this.game.updatePlayer(playerParams)
    })
    
    user.socket.on('player_resurrect', playerParams => {
      this.game.updatePlayer(playerParams, true)
      global.io.emit('player_resurrect', playerParams.id)
    })

    /**
     * "THIS" represent the active socket.
     */
    user.socket.on('disconnect', this.removeDisconnectedUser)
    
    this.game.startGameloopIfNeeded()
  }
  
  removeDisconnectedUser(reason) {
    const socketID = this.id
    const user = global.getUserByID(socketID)
    
    if (! user || ! user.gameroom) {
      // BAILL as this user is not.
      return
    }

    const colorIndex = user.gameroom.usedColors.indexOf(user.color)
    if (-1 < colorIndex) {
      user.gameroom.usedColors.splice(colorIndex, 1)
    }
    
    global.io.emit('player_disconnect', user.id)
    
    delete user.gameroom.users[user.id]
    delete user.gameroom.game.players[user.id]
    
    console.log(`Player ${user.id} has disconnected. Reason:`, reason, 'Users left count:', Object.keys(user.gameroom.users).length, 'Players left count:', Object.keys(user.gameroom.game.players).length);
    
    user.gameroom.game.stopGameloopIfNeeded()
  }
  
  getUniqueRandomColor(tries = 0) {
    const newColor = randomColor()
    if (this.usedColors.some(testColor => testColor === newColor)) {
      if (10 > tries) {
        tries++
        return this.getUniqueRandomColor(tries)
      }
      
      return '#000000'
    }
    
    this.usedColors.push(newColor)
    return newColor
  }
}

module.exports = Gameroom