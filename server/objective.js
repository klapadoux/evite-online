const Utils = require('./utils')
const settings = require('./settings')

let objectivesBirthCount = 0
let gestatingPressure = 0
const objectives = []
const size = 40
const spawnTop = 50 + size
const spawnBottom = settings.PLAYGROUND_HEIGHT - 50 - size - spawnTop
const spawnRight = settings.PLAYGROUND_WIDTH * 0.75
const spawnLeft = 50 + size

const createObjective = (data) => {

  const { x, y } = Utils.getRandomCoordInRect(spawnLeft, spawnTop, spawnRight, spawnBottom )

  const newObjective = {
    x,
    y,
    size,
    id: ++objectivesBirthCount,
    dead: false,
  }

  objectives.push(newObjective)

  return newObjective
}

/**
 * @param {int} modifier Higher the number, faster the spawning. 0 and lower means no spawning.
 */
const checkObjectivesGestation = (modifier = 1) => {
  if (0 >= modifier) {
    // BAIL. No spawning.
    return
  }

  gestatingPressure += modifier

  // Entamer la création d'enemies si ce n'est pas déjà en cours.
  if (
    settings.MAX_OBJECTIVES_AT_ONCE > objectives.length &&
    30 < gestatingPressure
  ) {
    gestatingPressure = 0
    createObjective()
  }
}

const getObjectives = () => {
  return objectives
}

const deleteDeadObjectives = () => {
  for(let index = objectives.length - 1; 0 <= index; index--) {
    if (objectives[index].dead) {
      objectives.splice(index, 1)
    }
  }
}

module.exports.checkObjectivesGestation = checkObjectivesGestation
module.exports.getObjectives = getObjectives
module.exports.deleteDeadObjectives = deleteDeadObjectives
