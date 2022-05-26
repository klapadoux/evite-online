import Game from './game.js'
import Player from './player.js'

const socket = io()  
const startButton = document.getElementById('join-game-button')
let userGame = null

const startGame = () => {
  socket.emit('user_is_ready_to_play', {
    id: socket.id,
    name: document.querySelector('input[name="player_name"]').value
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
  
  console.log('END connect');
});


socket.on('init_user_as_player', player => {  
  player.isUser = true
  
  const ourPlayer = new Player(player)
  console.log( 'This is you:', ourPlayer );
  
  userGame.addOurPlayer(ourPlayer)
})


const form = document.getElementById('user-info-form')
form.addEventListener('submit', (event) => {
  event.preventDefault()
})

const playerNameInput = document.getElementById('player-name')
playerNameInput.addEventListener('keyup', (event) => {
  if ('' !== event.target.value) {
    startButton.classList.add('join-game-button--active')
  } else {
    startButton.classList.remove('join-game-button--active')
  }
})