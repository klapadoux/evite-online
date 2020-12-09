const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const randomColor = require('randomcolor')

const Game = require('./server/game')
const Settings = require('./server/settings')
const Utils = require('./server/utils')
const {createPlayer} = require('./server/player')
const {checkObjectivesGestation, getObjectives, deleteDeadObjectives} = require('./server/objective')



const app = express()
app.use(express.static(`${__dirname}/client`))
const server = http.createServer(app)
const io = socketio(server)

const game = new Game(io)

const usedColors = []

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
    
    const {x, y, size} = players[playerId]
    const playerRadius = size / 2
    
    enemies.forEach(enemy => {
      if (
        enemy.y <= y + playerRadius &&
        enemy.x + enemy.size >= x - playerRadius &&
        enemy.y + enemy.size >= y - playerRadius &&
        enemy.x <= x + playerRadius
      ) {
        players[playerId].dead = true
        players[playerId].velocity = enemy.velocity
        players[playerId].goalPos = enemy.goalPos
        
        moveElement(players[playerId], 0.33)
        
        score -= 1
        
        io.emit('player_death', players[playerId].color)
      }
    })
    
    // Check again for player death.
    if (players[playerId].dead) {
      continue
    }
    
    const objectives = getObjectives()
    objectives.forEach(objective => {
      const distance = Utils.get2PosDistance(
        {x, y},
        {x: objective.x + objective.size / 2, y: objective.y + objective.size / 2}
      )
      if ( distance <= objective.size / 2 + playerRadius ) {
        score += 2
        objective.dead = true
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
    deleteDeadObjectives()
  }
  
  doGameLoopEnnemiesCheck =  ! doGameLoopEnnemiesCheck
}

const emitUpdateToClients = () => {
  io.emit('tick_update', {
    enemies: enemies,
    players: getPlayersEmitParams(),
    objectives: getObjectives(),
    score: score,
  })
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
  socket.emit('init_this_connection', players[socket.id])
  
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
