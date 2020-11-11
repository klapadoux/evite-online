// const randomColor = require('randomcolor');

(() => {
  const sock = io()
  
  const create_player_avatar = () => {
    
  }
  
  sock.on('init_player', text => {
    // console.log( randomColor() );
  })
  
  sock.on('mousemove', pos => {
    console.log( pos );
    const serverDot = document.createElement('div')
    serverDot.classList.add('server-dot')
    serverDot.style.top = pos.y + 'px'
    serverDot.style.left = pos.x + 'px'
    document.body.append(serverDot)
  })
  
  window.addEventListener('mousemove', event => {
    sock.emit('mousemove', {
      x: event.pageX,
      y: event.pageY,
    })
  })
})()