const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')
const gameloop = require('node-gameloop')

const Utils = require('./server/utils')
const {createPlayer} = require('./server/player')
const {createObjective, checkObjectivesGestation, getObjectives} = require('./server/objective')



const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)
const io = socketio(server)


const players = {}
const enemies = []
const usedColors = []

let gameLoopId = null

let doGameLoopEnnemiesCheck = true
let ennemiesBirthCount = 0
let enemiesAreGestating = false


const checkEnnemiesGestation = () => {
  // Entamer la création d'ennemies si ce n'est pas déjà en cours.
  if (!enemiesAreGestating) {
    enemiesAreGestating = true
    const size = Math.floor(Math.random() * 100) + 50
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
    enemy.dead = moveElement(enemy, delta)
  })
}

const deleteDeadEnemies = () => {
  enemies.forEach((enemy, index) => {
    if (enemy.dead) {
      enemies.splice(index, 1)
    }
  })
}

/**
 * @todo Corriger les collisions
 */
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
        players[playerId].velocity = enemy.velocity
        players[playerId].goalPos = enemy.goalPos
        
        moveElement(players[playerId], 0.5)
        
        io.emit('player_death', players[playerId].color)
      }
    })
  }
}

const updateAllPlayers = (delta) => {
  for (playerId in players) {
    if (!players[playerId].dead) {
      moveElement(players[playerId], delta)
    }
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
  const {color, velocity} = data
  const player = getPlayerByColor(color)
  
  if (player) {
    player.goalPos = data.goalPos
    player.velocity = data.velocity
    
    if (isPlayerResurrecting) {
      player.x = data.goalPos.x
      player.y = data.goalPos.y
      player.dead = false
    }
  }
}

const getPlayersEmitParams = () => {
  const playersParams = []
  for (player in players) {
    const {x, y, goalPos, velocity, color, dead} = players[player]
    playersParams.push({
      x: x,
      y: y,
      color: color,
      goalPos: goalPos,
      velocity: velocity, // Pixels by ms
      dead: dead,
    })
  }
  return playersParams
}

const moveElement = (element, delta = 1) => {
  // Calculating next step.
  const nextStep = element.velocity * delta
  const remainingDistance = Utils.get2PosDistance(element.goalPos, {x: element.x, y: element.y})
  let reachedGoal = false
  if (nextStep < remainingDistance) {
    const ratio = nextStep / remainingDistance
    const stepX = (element.goalPos.x - element.x) * ratio
    const stepY = (element.goalPos.y - element.y) * ratio
    element.x = element.x + stepX
    element.y = element.y + stepY
  } else {
    element.x = element.goalPos.x
    element.y = element.goalPos.y
    reachedGoal = true
  }
  
  return reachedGoal
}

const updateGameboard = (delta) => {
  if (doGameLoopEnnemiesCheck) {
    checkObjectivesGestation()
    
    checkEnnemiesGestation()
    checkCollisions()
    updateEnemies(delta)
  }
  
  updateAllPlayers(delta)
  
  emitUpdateToClients()
  
  if (doGameLoopEnnemiesCheck) {
    deleteDeadEnemies()
  }
  
  doGameLoopEnnemiesCheck =  ! doGameLoopEnnemiesCheck
}

const emitUpdateToClients = () => {
  io.emit('tick_update', {
    enemies: enemies,
    players: getPlayersEmitParams(),
    objectives: getObjectives(),
  })
}

const startGameloopIfNeeded = () => {
  if (!gameLoopId) {
    gameLoopId = gameloop.setGameLoop(updateGameboard, 1000 / 30)
  }
}

const stopGameloopIfNeeded = () => {
  if (!Object.keys(players).length) {
    gameloop.clearGameLoop(gameLoopId)
    gameLoopId = null
  }
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
  players[socket.id] = createPlayer({ color: getRandomColor() })
  socket.emit('init_player', players[socket.id])
  
  socket.on('mousemove', playerParams => {
    updatePlayer(playerParams)
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
