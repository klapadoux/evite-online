class User {
  constructor(socket, color) {
    this.socket = socket
    this.id = socket.id
    this.color = color
  }
}

module.exports = User