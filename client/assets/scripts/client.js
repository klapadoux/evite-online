import Game from './game.js'
import Player from './player.js'
import ImpatientCircles from './impatient-circles.js'
import { userSettings } from './settings.js'

const socket = io()
const startButton = document.getElementById('join-game-button')

const playerNameInput = document.getElementById('player-name')
const savedName = localStorage.getItem('player_name')
const impatientCircles = new ImpatientCircles({ node: document.querySelector('.impatient-circles') })

let userGame = null

const startGame = () => {
  const playerName = playerNameInput.value
  if ('' === playerName) {
    // BAIL. Need a name.
    return
  }

  localStorage.setItem('player_name', playerName)

  socket.emit('user_is_ready_to_play', {
    id: socket.id,
    name: playerName
  })

  const section = document.querySelector('.user-section')
  section.classList.add('user-section--disabled')

  startButton.removeEventListener('mouseup', startGame)
}


socket.once('connect', () => {
  startButton.addEventListener('mouseup', startGame)

  socket.emit('get_game', game => {
    userGame = new Game(socket, game)
  })
});


socket.on('init_user_as_player', player => {
  player.isUser = true

  const ourPlayer = new Player(player)
  console.log( 'This is you:', ourPlayer );

  userGame.addOurPlayer(ourPlayer)
  impatientCircles.stop()
})


const form = document.getElementById('user-info-form')
form.addEventListener('submit', (event) => {
  event.preventDefault()
})

playerNameInput.addEventListener('keyup', (event) => {
  if ('Enter' === event.key) {
    // Even though it is not best practice,
    // the user chose to appear where the mouse is using Enter
    // and he'll most likely die right away, but
    // using enter is the normal way to send a form,
    // so who are we to juge.
    startGame()
    return
  }

  if ('' !== event.target.value) {
    if (! impatientCircles.running) {
      startButton.classList.add('join-game-button--active')
      impatientCircles.start()
    }
  } else {
    startButton.classList.remove('join-game-button--active')
    impatientCircles.stop()
  }
})

///// INIT
playerNameInput.focus();
if (null !== savedName && '' !== savedName) {
  playerNameInput.setAttribute('value', savedName)
  startButton.classList.add('join-game-button--active')
  impatientCircles.start()
}

///// INIT USER SETTINGS
let classes = ''
if (userSettings.objectTransition) {
  classes += ' object-has-transition'
}
if (userSettings.objectAnimation) {
  classes += ' object-has-animation'
}

if ('' !== classes) {
  document.body.setAttribute('class', document.body.class + ' ' + classes)
}
