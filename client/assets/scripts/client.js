(() => {
  const sock = io()
  
  let thisPlayer;
  const players = {}
  
  const Player = (args) => {
    return {
      args,
      color: '#000',
      x: 0,
      y: 0,
      node: null,
      
      createNode() {
        this.node = document.createElement('div')
        this.node.classList.add('player')
        this.node.style.backgroundColor = this.color
        this.node.style.top = this.y + 'px'
        this.node.style.left = this.x + 'px'
      },
      
      moveTo({x, y}) {
        this.y = x
        this.y = y
        this.node.style.top = y + 'px'
        this.node.style.left = x + 'px'
      },
      
      getEmitParams() {
        return {
          color: this.color,
          x: this.x,
          y: this.y,
        }
      },
      
      init() {
        const {color, x, y} = args
        this.color = color
        this.x = x
        this.y = y
        this.createNode()
        
        return this
      }
    }.init()
  }
  
  const addPlayerToGame = (player) => {
    document.body.append(player.node)
    players[player.color] = player
  }
  
  
  sock.on('init_player', args => {
    thisPlayer = Player(args)
    addPlayerToGame(thisPlayer)
  })
  
  sock.on('mousemove', playerArgs => {
    if ( 'undefined' === typeof players[playerArgs.color] ) {
      addPlayerToGame(Player(playerArgs))
    }
    
    players[playerArgs.color].moveTo(playerArgs) 
  })
  
  window.addEventListener('mousemove', event => {
    thisPlayer.x = event.pageX
    thisPlayer.y = event.pageY
    
    sock.emit('mousemove', thisPlayer.getEmitParams())
  })
})()