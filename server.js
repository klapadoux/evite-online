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
const enemies = []
const usedColors = []

let gameLoopId = null

let ennemiesBirthCount = 0
let enemiesAreGestating = false

const checkEnnemiesGestation = () => {
  // Entamer la création d'ennemies si ce n'est pas déjà en cours.
  if (!enemiesAreGestating) {
    enemiesAreGestating = true
    const size = Math.floor(Math.random() * 100) + 10
    setTimeout(() => {
      enemies.push({
        id: ++ennemiesBirthCount,
        x: size * -1,
        y: Math.floor(Math.random() * 1080) - 50,
        goalPos: {
          x: 1920,
          y: Math.floor(Math.random() * 1080),
        },
        velocity: Math.floor(Math.random() * 500) + 100, // Pixels by ms
        size: size,
        dead: false,
      })
      
      enemiesAreGestating = false
    }, 2000 / (Object.keys(players).length + 1));
  }
}

const updateEnemies = (delta) => {
  enemies.forEach(enemy => {
    
    // Calculating next step.
    const nextStep = enemy.velocity * delta
    const remainingDistance = get2PosDistance(enemy.goalPos, {x: enemy.x, y: enemy.y})
    if (nextStep < remainingDistance) {
      const ratio = nextStep / remainingDistance
      const stepX = (enemy.goalPos.x - enemy.x) * ratio
      const stepY = (enemy.goalPos.y - enemy.y) * ratio
      enemy.x = enemy.x + stepX
      enemy.y = enemy.y + stepY
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

const checkCollisions = () => {
  // Players circle against enemies square.
  for (let playerId in players) {
    if (players[playerId].dead) {
      continue
    }
    
    enemies.forEach(enemy => {
      const {x, y, size} = players[playerId]
      const playerRadius = size / 2

      if (
        enemy.y <= y + playerRadius &&
        enemy.x + enemy.size >= x - playerRadius &&
        enemy.y + enemy.size >= y - playerRadius &&
        enemy.x <= x + playerRadius
      ) {
        players[playerId].dead = true
        io.emit('player_death', players[playerId].color)
        // enemy.dead = true
      }
    })
  }
}

const getPlayerByColor = (playerColor) => {
  for(playerId in players) {
    if ('undefined' !== typeof players[playerId].color && playerColor === players[playerId].color) {
      return players[playerId]
    }
  }
  
  return null
}

const updatePlayer = (data, isPlayerResurrecting = false) => {
  const {color} = data
  const player = getPlayerByColor(color)
  
  if (player) {
    Object.assign(player, data)
    
    if (isPlayerResurrecting) {
      player.dead = false
    }
  }
} 

const updateGameboard = (delta) => {
  checkEnnemiesGestation()
  checkCollisions()
  updateEnemies(delta)
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
    size: 30,
  }
  socket.emit('init_player', players[socket.id])
  
  socket.on('mousemove', playerParams => {
    updatePlayer(playerParams)
    io.emit('mousemove', playerParams)
  })
  
  socket.on('player_resurrect', playerParams => {
    updatePlayer(playerParams, true)
    io.emit('player_resurrect', playerParams.color)
  })
  
  socket.on('disconnect', reason => {
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
