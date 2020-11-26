let objectivesAreGestating = false
let objectivesBirthCount = 0
const objectives = []

const createObjective = (data) => {
  const size = 30
  
  return {
    id: ++objectivesBirthCount,
    x: Math.floor(Math.random() * (500 - size * 2)) + size,
    y: Math.floor(Math.random() * (500 - size * 2)) + size,
    // x: Math.floor(Math.random() * (1920 - size * 2)) + size,
    // y: Math.floor(Math.random() * (1080 - size * 2)) + size,
    size: size,
    dead: false,
  }
}

const checkObjectivesGestation = () => {
  // Entamer la création d'ennemies si ce n'est pas déjà en cours.
  if (!objectivesAreGestating) {
    objectivesAreGestating = true
    setTimeout(() => {
      objectives.push(createObjective())
      objectivesAreGestating = false
    }, 5000);
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

module.exports.createObjective = createObjective
module.exports.checkObjectivesGestation = checkObjectivesGestation
module.exports.getObjectives = getObjectives
module.exports.deleteDeadObjectives = deleteDeadObjectives
