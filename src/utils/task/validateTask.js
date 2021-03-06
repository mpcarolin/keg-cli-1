const { isObj, isFunc } = require('@ltipton/jsutils')
const { throwNoAction, throwNoTask } = require('../error')

/**
 * Validates a task to ensure it can be run
 * @function
 * @param {Object} task - Task object to validate that an action exists
 * @param {string} taskPath - Path where the passed in task argument exists
 *
 * @returns {Object} - Task if it's valid
 */
const validateTask = (task, taskPath) => {
  // Check the task is an object
  return !isObj(task)
    ? throwNoTask(taskPath ? taskPath.replace(/\./g, ' ') : task)
    // Check the action for the found task exists
    : !isFunc(task.action)
      ? throwNoAction(task)
      : task
}

module.exports = {
  validateTask
}