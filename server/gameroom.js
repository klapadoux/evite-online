const Game = require('./game')
const settings = require('./settings')
const { createPlayer } = require('./player')
const randomColor = require('randomcolor')

class Gameroom {
  constructor() {
    this.users = {}
    this.game = null

    this.usedColors = []

    this.newGame()
  }

  newGame() {
    this.game = new Game()
  }

  registerUser(user) {
    console.log(`Add user to game: ${user.id}`);
    this.initUser(user)
  }

  registerUserById(userId) {
    console.log(`Add user ID to game: ${userId}`);

    if ('undefined' !== typeof this.users[userId]) {
      // BAIL if this user already exist.
      return
    }

    console.log(`DONE: ${userId}`);

    const user = global.getUserById(userId)

    if (! user) {
      // BAIL if this user doesn't exist.
      return
    }

    this.initUser(user)
  }

  initUser(user) {
    this.users[user.id] = user
    user.setGameroom(this)

    user.socket.on('get_player_data_by_id', (id) => {
      const player = this.game.getPlayerById(id)
      if (player) {
        user.socket.emit('player_data', player)
      }
    })

    user.socket.once('get_game', (callback) => {
      callback({
        playgroundWidth: this.game.playgroundWidth,
        playgroundHeight: this.game.playgroundHeight,
      })
    })

    user.socket.once('user_is_ready_to_play', (args) => {
      console.log('GO', args);
      const { id, name } = args

      if ('undefined' === typeof this.users[id]) {
        // BAIL. Not a user.
        return false;
      }

      if (name) {
        this.users[id].name = name
      }

      this.addUserToGame(this.users[id])
    })

    user.socket.on('pause_player', (args) => {
      const { id } = args
      this.game.pausePlayer(id)
    })
    user.socket.on('unpause_player', (args) => {
      const { id } = args
      this.game.unpausePlayer(id)
    })
  }

  addUserToGame(user) {
    if (this.game.doesPlayerExists(user.id)) {
      console.log( `User Id "${user.id}" is back to game`, user.name );
      this.game.setPlayerName(user.id, user.name)

      // BAIL. User already exists. No need to do the whole setup again.
      return
    }

    // Register the User as a new player
    console.log( `Adding user Id "${user.id}" to game`, user.name );
    const x = this.game.playgroundWidth - 25;
    const y = this.game.playgroundHeight / 2 - 15;
    const player = createPlayer({
      id: user.id,
      name: user.name,
      pseudo: user.pseudo,
      color: this.getUniqueRandomColor(),
      x: x,
      y: y,
      goalPos: { x, y }
    })

    this.game.addPlayer(player)


    // Tell this user that it has now become a player.
    user.socket.emit('init_user_as_player', player)


    ///// Socket ON events for the game.

    user.socket.on('mousemove', playerParams => {
      this.game.updatePlayer(playerParams)
    })

    user.socket.on('charge_teleport', playerParams => {
      this.game.updatePlayer(playerParams)
    })

    user.socket.on('teleport_player_to', playerParams => {
      this.game.setPlayerPos(playerParams)
      this.game.updatePlayer(playerParams)
    })

    user.socket.on('player_resurrect', playerParams => {
      this.game.updatePlayer(playerParams, true)
      global.io.emit('player_resurrect', playerParams.id)
    })


    user.socket.on('disconnect', this.removeDisconnectedUser)

    this.game.startGameloopIfNeeded()
  }

  /**
   * "THIS" represent the active socket.
   */
  removeDisconnectedUser(reason) {
    const socketId = this.id
    const user = global.getUserById(socketId)

    if (! user || ! user.gameroom) {
      // BAILL as this user is not.
      return
    }

    const colorIndex = user.gameroom.usedColors.indexOf(user.color)
    if (-1 < colorIndex) {
      user.gameroom.usedColors.splice(colorIndex, 1)
    }

    global.io.emit('player_disconnect', user.id)

    delete user.gameroom.users[user.id]

    user.gameroom.game.removePlayerById(user.id)

    console.log(`Player ${user.id} has disconnected. Reason:`, reason, 'Users left count:', Object.keys(user.gameroom.users).length, 'Players left count:', Object.keys(user.gameroom.game.players).length);

    user.gameroom.game.stopGameloopIfNeeded()
  }

  getUniqueRandomColor(tries = 0) {
    const newColor = randomColor()
    if (this.usedColors.some(testColor => testColor === newColor)) {
      if (10 > tries) {
        tries++
        return this.getUniqueRandomColor(tries)
      }

      return '#000000'
    }

    this.usedColors.push(newColor)
    return newColor
  }
}

module.exports = Gameroom