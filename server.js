const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const db = require('./server/database')
const Game = require('./server/game')
const { createPlayer } = require('./server/player')

const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)

global.io = socketio(server)

const usedColors = []

const game = new Game()


const getUniqueRandomColor = (tries = 0) => {
  const newColor = randomColor()
  if (usedColors.some(testColor => testColor === newColor)) {
    if (10 > tries) {
      tries++
      return getUniqueRandomColor(tries)
    }
    
    return '#000'
  }
  
  usedColors.push(newColor)
  return newColor
}


global.io.on('connection', socket => {
  game.players[socket.id] = createPlayer({ color: getUniqueRandomColor() })
  
  // const { pseudo, color } = game.players[socket.id]
  // db.promise().query(`INSERT INTO players (pseudo, color) VALUES ('${color}', '${color}')`)
  
  socket.emit('init_this_connection', game.players[socket.id])
  
  
  ///// Socket ON events
  
  socket.on('mousemove', playerParams => {
    game.updatePlayer(playerParams)
  })
  
  socket.on('player_resurrect', playerParams => {
    game.updatePlayer(playerParams, true)
    global.io.emit('player_resurrect', playerParams.color)
  })
  
  socket.on('disconnect', reason => {
    const colorIndex = usedColors.indexOf(game.players[socket.id].color)
    if (-1 < colorIndex) {
      usedColors.splice(colorIndex, 1)
    }
    console.log(`Player ${game.players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason, usedColors);
    global.io.emit('player_disconnect', game.players[socket.id].color)
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
