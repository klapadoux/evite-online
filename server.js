const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')
const gameloop = require('node-gameloop')


const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)
const io = socketio(server)


const players = {}
const usedColors = []

const enemies = []
let ennemiesBirthCount = 0

let gameLoopId = null

let enemiesAreGestating = false
const checkEnnemiesGestation = () => {
  // Entamer la création d'ennemies si ce n'est pas déjà en cours.
  if (!enemiesAreGestating) {
    enemiesAreGestating = true
    
    setTimeout(() => {      
      enemies.push({
        id: ++ennemiesBirthCount,
        x: -30,
        y: Math.floor(Math.random() * 1080) - 30,
        goalPos: {
          x: 1920,
          y: Math.floor(Math.random() * 1080),
        },
        velocity: Math.floor(Math.random() * 500) + 100, // Pixels by ms
        size: Math.floor(Math.random() * 100) + 10,
        dead: false,
      })
      
      enemiesAreGestating = false
    }, 1000);
  }
}

const updateEnemies = (delta) => {
  enemies.forEach(enemy => {
    const nextStep = enemy.velocity * delta
    const remainingDistance = get2PosDistance(enemy.goalPos, {x: enemy.x, y: enemy.y})
    if (nextStep < remainingDistance) {
      const ratio = nextStep / remainingDistance
      const stepX = (enemy.goalPos.x - enemy.x) * ratio
      const stepY = (enemy.goalPos.y - enemy.y) * ratio
      enemy.x = enemy.x + stepX
      enemy.y = enemy.y + stepY
      enemy.dead = false
    } else {
      enemy.x = enemy.goalPos.x
      enemy.y = enemy.goalPos.y
      enemy.dead = true
    }
  })
}

const deleteDeadEnemies = () => {
  enemies.forEach((enemy, index) => {
    if (enemy.dead) {
      enemies.splice(index, 1)
    }
  })
}

const checkEnemiesPlayersCollisions = () => {
  for (let playerId in players) {
    enemies.forEach(enemy => {
      const playerPos = {x: players[playerId].x, y: players[playerId].y}
      const enemyPos = {x: enemy.x, y: enemy.y}
      const distance = get2PosDistance(playerPos, enemyPos)
      
      console.log( distance );
    })
  }
}

const updateGameboard = (delta) => {
  checkEnnemiesGestation()
  updateEnemies(delta)
  checkEnemiesPlayersCollisions()
  emitUpdateToClients()
  deleteDeadEnemies()
}

const emitUpdateToClients = () => {
  io.emit('tick_update', {
    enemies: enemies,
  })
}

const startGameloopIfNeeded = () => {
  if (!gameLoopId) {
    gameLoopId = gameloop.setGameLoop(updateGameboard, 1000 / 15)
  }
}

const stopGameloopIfNeeded = () => {
  if (!Object.keys(players).length) {
    gameloop.clearGameLoop(gameLoopId)
    gameLoopId = null
  }
}

const get2PosDistance = (pos1, pos2) => {
  const dx = pos1.x - pos2.x
  const dy = pos1.y - pos2.y
  return Math.sqrt(dx * dx + dy * dy)
}

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
    console.log(`Player ${players[socket.id].color} (${socket.id}) has disconnected. Reason:`, reason, usedColors);
    io.emit('player_disconnect', players[socket.id].color)
    delete players[socket.id]

    stopGameloopIfNeeded()
  })
  
  startGameloopIfNeeded()
})

server.on('error', error => {
  console.log(error);
})

const port = process.env.PORT || 8080
server.listen(port, () => {
  console.log('Our app is running on http://localhost:' + port)
})
