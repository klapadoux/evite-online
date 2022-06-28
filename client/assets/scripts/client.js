import Game from './game.js'
import Player from './player.js'
import ImpatientCircles from './impatient-circles.js'

const socket = io()  
const startButton = document.getElementById('join-game-button')
const impatientCircles = new ImpatientCircles({ node: document.querySelector('.impatient-circles') })
let userGame = null

const startGame = () => {
  const playerName = document.querySelector('input[name="player_name"]').value
  console.log(playerName);
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

const playerNameInput = document.getElementById('player-name')
const savedName = localStorage.getItem('player_name')
if (null !== savedName && '' !== savedName) {
  playerNameInput.setAttribute('value', savedName)
  startButton.classList.add('join-game-button--active')
  impatientCircles.start()
}
playerNameInput.addEventListener('keyup', (event) => {
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