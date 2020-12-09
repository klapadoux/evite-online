const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const Game = require('./server/game')
const {createPlayer} = require('./server/player')



const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)
const io = socketio(server)

const usedColors = []

const game = new Game(io)


const getRandomColor = (tries = 0) => {
  const newColor = randomColor()
  if (usedColors.some(testColor => testColor === newColor)) {
    if (10 > tries) {
      tries++
      return getRandomColor(tries)
    }
    
    return '#000'
  }
  
  usedColors.push(newColor)
  return newColor
}


io.on('connection', socket => {
  game.players[socket.id] = createPlayer({ color: getRandomColor() })
  socket.emit('init_this_connection', game.players[socket.id])
  
  socket.on('mousemove', playerParams => {
    game.updatePlayer(playerParams)
  })
  
  socket.on('player_resurrect', playerParams => {
    game.updatePlayer(playerParams, true)
    io.emit('player_resurrect', playerParams.color)
  })
  
  socket.on('disconnect', reason => {
    const colorIndex = usedColors.indexOf(game.players[socket.id].color)
    if (-1 < colorIndex) {
      usedColors.splice(colorIndex, 1)
    }
    console.log(`Player ${game.players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason, usedColors);
    io.emit('player_disconnect', game.players[socket.id].color)
    delete game.players[socket.id]

    game.stopGameloopIfNeeded()
  })
  
  game.startGameloopIfNeeded()
})

server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port)
})
