const {
  containerService,
  serviceOptions,
  startService,
} = require('KegUtils/services')


/**
 * Start a keg-components inside docker
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const startComponents = async (args) => {
  const { params: { service } } = args

  // Check and run the correct service
  const serviceResp = service === 'container'
    ? await containerService(args, { context: 'components', container: 'keg-components' })
    : await startService(args, { context: 'components', container: 'keg-components' })

  return serviceResp

}

module.exports = {
  start: {
    name: 'start',
    alias: [ 'st', 'run' ],
    action: startComponents,
    description: `Runs keg-components in a docker container`,
    example: 'keg components start <options>',
    options: serviceOptions('components', 'start'),
  }
}