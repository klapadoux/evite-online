const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')
const Gameheart = require('./server/gameheart')


const app = express()

app.use(express.static(`${__dirname}/client`))

const server = http.createServer(app)
const io = socketio(server)

const players = {}
const usedColors = []


const updateGameboard = (dt, t) => {
  // console.log( gameheart.getFps() );
}

const renderGameboard = (dt) => {
  console.log( gameheart.trappedFrames.length );
}

const gameheart = new Gameheart(10100, 12, 100, updateGameboard, renderGameboard)
gameheart.start()

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

const startTickIfNeeded = () => {
  if ( Gameheart ) {
    // Gameheart
  }
}

io.on('connection', socket => {
  players[socket.id] = {
    color: getRandomColor(),
    x: 300,
    y: 300,
  }
  socket.emit('init_player', players[socket.id])
  
  socket.on('mousemove', playerParams => {
    io.emit('mousemove', playerParams)
  })
  
  socket.on('disconnect', (reason) => {
    const colorIndex = usedColors.indexOf(players[socket.id].color)
    if (-1 < colorIndex) {
      usedColors.splice(colorIndex, 1)
    }
    // console.log(`Player ${players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason, usedColors);
    io.emit('player_disconnect', players[socket.id].color)
    delete players[socket.id]
  })
  
  startTickIfNeeded()
})

server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port)
})
