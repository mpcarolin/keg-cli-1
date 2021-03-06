const { ask } = require('askIt')
const docker = require('KegDocCli')
const { checkCall } = require('@ltipton/jsutils')
const { throwNoContainers } = require('KegUtils/error/throwNoContainers')

/**
 * Prompts user to select a container from the current docker containers
 * @param {function} filter - Method to filter which containers are displayed. Must return array
 *
 * @returns {Object} the selected containers
 */
const containerSelect = async (filter) => {
  const containers = await docker.container.list()

  // If no containers available, then call throwNoContainers
  !containers.length && throwNoContainers()

  // Filter the containers if filter method passed
  const filtered = checkCall(filter, containers) || containers

  // Get a string of each container to print to terminal
  const items = filtered.map(cont => `${cont.name} | ${ cont.image } | ${ cont.id }`)

  const index = await ask.promptList(
    items,
    'Docker Containers: ( Name | Image | ID )',
    'Select a container:'
  )

  return containers[index]
}

module.exports = {
  containerSelect
}
