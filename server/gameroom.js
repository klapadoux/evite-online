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
  
  addUserById(userId) {    
    if ('undefined' !== typeof this.users[userId]) {
      // BAIL if this user already exist.
      return
    }
    
    const user = global.getUserById(userId)
    
    if (! user) {
      // BAIL if this user doesn't exist.
      return
    }
    
    // Register this gameroom for the user.
    this.users[userId] = user
    user.setGameroom(this)
    
    this.addUserToGame(user)
  }
  
  addUserToGame(user) {
    console.log( `Adding user Id "${user.id}" to game` );
    
    // Register the User as a new player
    const player = createPlayer({
      id: user.id,
      pseudo: user.pseudo,
      color: this.getUniqueRandomColor(),
      invincible: true,
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

    
    user.socket.on('disconnect', this.removeDisconnectedUser)
    
    this.game.startGameloopIfNeeded()
  }
  
  /**
   * "THIS" represent the active socket.
   */
  removeDisconnectedUser(reason) {
    const socketId = this.id
    const user = global.getUserById(socketId)
    
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