const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const db = require('./server/database')

const User = require('./server/user')
const Gameroom = require('./server/gameroom')

const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)

global.io = socketio(server)

const users = {}

/**
 * @todo Avoir multiples salles.
 */
// const gamerooms = []
// gamerooms.push(new Gameroom())
const gameroom = new Gameroom()



///// USERS MANAGEMENT /////
const createUserFromSocket = (socket) => {
  users[socket.id] = new User(socket)
  console.log(`New user connected: ${socket.id}`);
  
  global.sendUserToGameroomById(socket.id)
}

global.getUserById = (id) => {
  if ('undefined' !== typeof users[id]) {
    return users[id]
  }
  
  return false
}

global.sendUserToGameroomById = (id) => {
  if ('undefined' !== typeof users[id]) {
    gameroom.registerUser(users[id])
  }
}

/**
 * @todo Séparer le "Connection" du "Ajout joueur au jeu"
 */
global.io.on('connection', socket => {
  createUserFromSocket(socket)
})



server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port)
})
