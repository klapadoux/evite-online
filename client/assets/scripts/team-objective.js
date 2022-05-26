import Objective from './objective.js'

export class TeamObjective extends Objective {
  constructor(args) {
    super(args)
    
    console.log('Hello ?');
    
    // const { id, x, y, size, dead } = args
    
    // this.id = id
    // this.x = x ? x : 0
    // this.y = y ? y : 0
    // this.size = size ? size : 30,
    // this.dead = dead ? dead : false
    
    // this.createNode()
  }
  
  createNode() {
    super.createNode()
    
    this.node.classList.add('objective--team')
  }

  // update(data) {
  //   Object.assign(this, data)
  // }
  
  // isDead() {
  //   return this.dead
  // }
}

export default TeamObjective