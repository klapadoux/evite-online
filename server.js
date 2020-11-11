const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const app = express()

app.use(express.static(`${__dirname}/client`))

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', sock => {
  sock.emit('init_player', {
    color: randomColor(),
    x: 300,
    y: 300,
  })
  
  sock.on('mousemove', playerParams => io.emit('mousemove', playerParams))
})

server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port);
})