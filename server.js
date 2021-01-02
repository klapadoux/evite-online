const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const db = require('./server/database')

const User = require('./server/user')
const Gameroom = require('./server/game')
const Game = require('./server/game')

const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)

global.io = socketio(server)

const usedColors = []

const users = {}
const gamerooms = []

gamerooms.push(new Gameroom())


const getUniqueRandomColor = (tries = 0) => {
  const newColor = randomColor()
  if (usedColors.some(testColor => testColor === newColor)) {
    if (10 > tries) {
      tries++
      return getUniqueRandomColor(tries)
    }
    
    return '#000000'
  }
  
  usedColors.push(newColor)
  return newColor
}


///// USERS MANAGEMENT /////
const createUserFromSocket = (socket) => {
  users[socket.id] = new User(socket, getUniqueRandomColor())
}

global.getUserByID = (id) => {
  if ('undefined' !== typeof users[id]) {
    return users[id]
  }
  
  return false
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
