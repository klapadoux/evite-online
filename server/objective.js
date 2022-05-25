const Utils = require('./utils')
const settings = require('./settings')

let objectivesAreGestating = false
let objectivesBirthCount = 0
const objectives = []

const createObjective = (data) => {
  const size = 40
  
  const { x, y } = Utils.getRandomCoordInRect(50 + size, 50 + size, 1600, 800)
  
  return {
    x,
    y,
    size,
    id: ++objectivesBirthCount,
    dead: false,
  }
}

/**
 * @param {int} modifier Higher the number, faster the spawning. 0 and lower means no spawning.
 */
const checkObjectivesGestation = (modifier = 1) => {
  if (0 >= modifier) {
    // BAIL. No spawning.
    return
  }
  
  // Entamer la création d'enemies si ce n'est pas déjà en cours.
  if (settings.MAX_OBJECTIVES_AT_ONCE > objectives.length && ! objectivesAreGestating) {
    objectivesAreGestating = true
    setTimeout(() => {
      objectives.push(createObjective())
      objectivesAreGestating = false
    }, 1250 * (1 / modifier));
  }
}

const getObjectives = () => {
  return objectives
}

const deleteDeadObjectives = () => {
  objectives.forEach((objective, index) => {
    if (objective.dead) {
      objectives.splice(index, 1)
    }
  })
}

module.exports.checkObjectivesGestation = checkObjectivesGestation
module.exports.getObjectives = getObjectives
module.exports.deleteDeadObjectives = deleteDeadObjectives
