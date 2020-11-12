const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const app = express()

app.use(express.static(`${__dirname}/client`))

const server = http.createServer(app)
const io = socketio(server)

const players = {}

io.on('connection', socket => {  
  players[socket.id] = {
    color: randomColor(),
    x: 300,
    y: 300,
  }
  
  socket.emit('init_player', players[socket.id])
  
  socket.on('mousemove', playerParams => {
    io.emit('mousemove', playerParams)
  })
  
  socket.on('disconnect', (reason) => {
    console.log(`Player ${players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason);
    io.emit('player_disconnect', players[socket.id].color)
    delete players[socket.id]
  });
})

server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port);
})