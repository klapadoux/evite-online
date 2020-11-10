const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const app = express()

app.use(express.static(`${__dirname}/../client`))

const server = http.createServer(app)
const io = socketio(server)

io.on('connection', sock => {
  sock.emit('welcome_message', 'Salut dude.')
  
  sock.on('click', pos => io.emit('click', pos))
})

server.on('error', error => {
  console.log(error);
})

server.listen(8080, () => {
  console.log('Ready');
})