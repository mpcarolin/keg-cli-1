const docker = require('KegDocCli')
const { get } = require('@ltipton/jsutils')
const { Logger } = require('KegLog')
const { mutagen } = require('KegMutagen')
const { DOCKER } = require('KegConst/docker')
const { runInternalTask } = require('KegUtils/task/runInternalTask')
const { getMutagenConfig } = require('KegUtils/getters/getMutagenConfig')
const { buildContainerContext } = require('KegUtils/builders/buildContainerContext')
const {
  generalError,
  mutagenSyncExists,
  throwRequired,
  throwContainerNotFound
} = require('KegUtils/error')


/**
 * Creates the Mutagen sync params overrides config with command line params
 * Loads the config for the context
 * @param {Object} contextData - response from the buildContainerContext helper
 *
 * @returns {Object} - Build params for create a mutagen sync
 */
const getSyncParams = async (contextData, { local, remote, name, options }) => {

  const { alpha, beta, ...config } = await getMutagenConfig(
    contextData.cmdContext,
    contextData.name || contextData.image,
    {
      alpha: local || get(contextData, 'contextEnvs.KEG_CONTEXT_PATH'),
      beta: remote || get(contextData, 'contextEnvs.DOC_APP_PATH')
    },
    options
  )

  !alpha && generalError(
    `Can not set the local path, missing "KEG_CONTEXT_PATH" environment variable!`
  )
  !beta && generalError(
    `Can not set the remote path, missing "DOC_APP_PATH" environment variable!`
  )

  return {
    config: config,
    local: alpha,
    remote: beta,
    container: contextData.id,
    name: name || contextData.cmdContext,
  }

}

/**
 * Start the mutagen daemon
 * @param {Object} args - Arguments passed to the task
 * @param {Object} params - Response from the getSyncParams helper
 *
 * @returns {void}
 */
const createMutagenSync = async (args, params, skipExists) => {
  // Make sure the mutagen daemon is running
  await runInternalTask('mutagen.tasks.daemon.tasks.start', args)

  // Check if the sync item already exists
  const exists = await mutagen.sync.exists(params)
  exists && !skipExists && mutagenSyncExists(params, exists, false)

  // Make call to start the mutagen sync
  !exists && await mutagen.sync.create(params)

  // If we started the sync, log to let the user know
  ;(!exists || skipExists) && Logger.highlight(`Mutagen sync`, `"${ params.name }"`, `created!`)

  return true
}

/**
 * Start the mutagen daemon
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const mutagenCreate = async args => {
  const { command, globalConfig, params, task, __internal={} } = args
  const { context, container } = params

  // Ensure we have a content to build the container
  !context && !container && throwRequired(task, 'context', task.options.context)

  // Get the context data for the command to be run
  let contextData = await buildContainerContext({
    task,
    params,
    __internal,
    globalConfig,
  })

  // Mutagen requires the container be running before the sync can be created
  // So check if the container id exists, if no id then throw
  !contextData.id && throwContainerNotFound(contextData.cmdContext)

  // Get the params to create the mutagen sync
  const syncParams = await getSyncParams(contextData, params)

  // Create the sync
  await createMutagenSync(args, syncParams, __internal.skipExists)

  // Return the context, and built sync params
  return { ...contextData, mutagen: syncParams }

  // TODO: Create sync for each repo based on the cmdContext
  // If cmdContext === core
  // Create sync for core / re-theme (node_modules) / tap-resolver (node_modules) / etc...

}

module.exports = {
  create: {
    name: 'create',
    alias: [ 'cr', 'start', 'st', 's' ],
    action: mutagenCreate,
    description: `Creates a mutagen sync between the local filesystem and a docker container`,
    example: 'keg mutagen create <options>',
    options: {
      context: {
        allowed: DOCKER.IMAGES,
        description: 'Context or name of the container to sync with',
        example: 'keg mutagen create --context core',
        enforced: true,
      },
      container: {
        alias: [ 'id' ],
        description: 'Name or Id of the container to sync with. Overrides context option',
        example: 'keg mutagen create --container my-container',
      },
      local: {
        alias: [ 'from' ],
        description: 'Local path to sync when container option is passed',
        example: 'keg mutagen create --container my-container --local ~/keg/keg-core',
        depends: { container: true },
        enforced: true,
      },
      name: {
        description: 'Name of the Mutagen sync to create',
        example: 'keg mutagen create --name my-sync',
      },
      remote: {
        alias: [ 'to' ],
        description: 'Remote path to sync when container option is passed',
        example: 'keg mutagen create --container my-container --remote keg/keg-core',
        depends: { container: true },
        enforced: true,
      },
      options: {
        alias: [ 'opts' ],
        description: 'Extra options to pass to the mutagen create command',
        example: 'keg mutagen create --options "--ignore /ignore/path"',
        depends: { container: true },
        enforced: true,
      },
      tap: {
        description: 'Name of the tap to build. Only needed if "context" argument is "tap"',
      },
    }
  }
}
