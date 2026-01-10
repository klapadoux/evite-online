const Utils = require('./utils')
const settings = require('./settings')

let objectivesBirthCount = 0
const objectives = []
const size = 100
const spawnTop = 50 + size
const spawnLeft = 50 + size
const spawnBottom = settings.PLAYGROUND_HEIGHT - 50 - size - spawnTop
const spawnRight = settings.PLAYGROUND_HEIGHT - 50 - size - spawnLeft

const createTeamObjective = (data) => {

  const { x, y } = Utils.getRandomCoordInRect(spawnLeft, spawnTop, spawnRight, spawnBottom )
  const claimZone = Utils.getRandomCoordInRect(spawnLeft, spawnTop, spawnRight, spawnBottom )

  const newObjective = {
    x,
    y,
    size,
    claimZone,
    id: ++objectivesBirthCount,
    type: 'teamObjective',
    dead: false,
    goalPos: { x, y },
    playersLinked: 0,
  }

  objectives.push(newObjective)

  return newObjective
}

const getTeamObjectives = () => {
  return objectives
}

const deleteDeadTeamObjectives = () => {
  for(let index = objectives.length - 1; 0 <= index; index--) {
    if (objectives[index].dead) {
      objectives.splice(index, 1)
    }
  }
}

const resetTeamObjectivesLinkedPlayersCount = () => {
  objectives.forEach(objective => objective.playersLinked = 0)
}

module.exports.createTeamObjective = createTeamObjective
module.exports.getTeamObjectives = getTeamObjectives
module.exports.deleteDeadTeamObjectives = deleteDeadTeamObjectives
module.exports.resetTeamObjectivesLinkedPlayersCount = resetTeamObjectivesLinkedPlayersCount
