import Objective from './objective.js'

export class TeamObjective extends Objective {
  constructor(args) {
    super(args)
    
    const { claimZone } = args
    
    this.claimZonePos = claimZone
    
    this.claimZoneNode = null
   
    this.createClaimZoneNode()
  }
  
  createNode() {
    super.createNode()
    
    this.node.classList.add('objective--team')
  }
  
  createClaimZoneNode() {
    const { x, y } = this.claimZonePos
    
    this.claimZoneNode = document.createElement('div')
    this.claimZoneNode.classList.add('claim-zone')
    this.claimZoneNode.style.top = `${y}px`
    this.claimZoneNode.style.left = `${x}px`
    this.claimZoneNode.style.width = `${this.size}px`
    this.claimZoneNode.style.height = `${this.size}px`
    
    document.getElementById('playground').append(this.claimZoneNode)
  }

  update(data) {
    super.update(data)
    
    this.claimZone
  }
  
  // isDead() {
  //   return this.dead
  // }
}

export default TeamObjective