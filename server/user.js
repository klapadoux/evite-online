class User {
  constructor(socket) {
    this.socket = socket
    this.id = socket.id
    this.pseudo = 'undefined'
    this.gameroom = null
  }
  
  setGameroom(gameroom) {
    this.gameroom = gameroom
  }
}

module.exports = User