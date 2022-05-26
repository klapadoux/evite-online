import Game from './game.js'
import Player from './player.js'

const socket = io()  
let userGame = null

socket.once('connect', () => {
  const form = document.getElementById('user-info-form')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    
    socket.emit('user_is_ready_to_play', {
      id: socket.id,
      name: document.querySelector('input').value
    })
    
    const section = document.querySelector('.user-section')
    section.classList.add('user-section--disabled')
  })
  
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
