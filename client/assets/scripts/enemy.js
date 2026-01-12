import { userSettings } from './settings.js'

export class Enemy {
  constructor(args) {
    const {id, x, y, goalPos, velocity, size, dead, node} = args

    this.id = id
    this.x = x ? x : 0
    this.y = y ? y : 0
    this.goalPos = goalPos ? goalPos : {x: 0, y: 0}
    this.velocity = velocity ? velocity : 10, // Pixels by ms
    this.size = size ? size : 20,
    this.dead = dead ? dead : false
    this.node = node ? node : null
    this.needToAppendMainNode = ! node

    this.initNode()

    if (userSettings.shadow) {
      this.initShadowNode()
    }

    this.moveTowardsGoal()

    setTimeout(() => {
      window.requestAnimationFrame(() => {this.node.classList.add('initiated')})
    }, 10);
  }

  initNode() {
    if (! this.node) {
      this.node = Enemy.createNode()
    }

    this.node.style.width = this.size + 'px'
    this.node.style.height = this.size + 'px'
  }

  initShadowNode() {
    this.shadowNode = document.createElement('div')
    this.shadowNode.classList.add('enemy-shadow')
    this.shadowNode.style.width = this.size + 4 + 'px'
    this.shadowNode.style.height = this.size + 4 + 'px'
  }

  /**
   * Update object data.
   *
   * @param {object} data
   */
  update(data) {
    Object.assign(this, data)
    this.moveTowardsGoal()
  }

  isDead() {
    return this.dead
  }

  die() {
    this.node.classList.add('dying')

    if (this.shadowNode) {
      this.shadowNode.classList.add('dying')
    }

    setTimeout(() => {
      this.node.remove()

      if (this.shadowNode) {
        this.shadowNode.remove()
      }
    }, 300)
  }

  moveTowardsGoal() {
    this.moveTo({x: this.x, y: this.y})
  }

  moveTo({x, y}) {
    this.x = x
    this.y = y
    this.node.style.transform = `translate3d(${x}px, ${y}px, 0)`

    if (this.shadowNode) {
      this.shadowNode.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0)`
    }
  }

  static createNode() {
    const newNode = document.createElement('div')
    newNode.classList.add('enemy')
    return newNode
  }
}

export default Enemy