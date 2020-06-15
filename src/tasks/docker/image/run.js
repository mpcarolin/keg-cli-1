
const { get } = require('jsutils')
const docker = require('KegDocCli')
const { spawnCmd } = require('KegProc')
const { CONTAINERS } = require('KegConst/docker/containers')
const { imageSelect } = require('KegUtils/docker/imageSelect')
const { buildLocationContext } = require('KegUtils/builders/buildLocationContext')


const buildContainerName = async cmdContext => {

  const imgName = get(
    CONTAINERS,
    `${ cmdContext.toUpperCase() }.ENV.IMAGE`,
    cmdContext
  )

  const imgContainer = `img-${imgName}`
  const exists = await docker.container.exists(
    imgContainer,
    container => container.names === imgContainer,
    'json'
  )

  // TODO: if the container already exists
  // Ask the user if they want to kill it, or not

  return imgContainer

}

const getImageContext = async (args) => {
  const { globalConfig, params, task } = args
  const { tag } = params

  // Get the context data for the command to be run
  const { cmdContext, contextEnvs, image, location, tap } = await buildLocationContext({
    globalConfig,
    task,
    params,
  })

  // Build the name for the container
  const container = await buildContainerName(cmdContext)

  return { container, contextEnvs, image, location, tag, tap }
}

const getImageData = async args => {
  const { globalConfig, task, params } = args

  const image = await imageSelect(args)

  // Get the context data for the command to be run
  const { cmdContext, contextEnvs, location, tap } = await buildLocationContext({
    task,
    globalConfig,
    params: { ...params, context: image.rootId },
  })

  // Build the name for the container
  const container = await buildContainerName(cmdContext)

  return {
    container,
    location,
    tag: image.tag,
    image: image.rootId,
  }

}

/**
 * Run a docker image command
 * @param {Object} args - arguments passed from the runTask method
 * @param {string} args.command - Initial command being run
 * @param {Array} args.options - arguments passed from the command line
 * @param {Object} args.tasks - All registered tasks of the CLI
 * @param {Object} globalConfig - Global config object for the keg-cli
 *
 * @returns {void}
 */
const runDockerImage = async args => {
  const { globalConfig, params, task } = args
  const { context, cleanup, entry } = params

  const { tag, location, contextEnvs, container, image } = context
    ? await getImageContext(args)
    : await getImageData(args)

  const opts = [ `-it` ]
  cleanup && opts.push(`--rm`)

  await docker.image.run({
    tag,
    opts,
    entry,
    image,
    location,
    envs: contextEnvs,
    name: container,
  })

}

module.exports = {
  run: {
    name: 'run',
    alias: [ 'rn', 'connect', 'con' ],
    action: runDockerImage,
    description: `Run a docker image as a container and auto-conntect to it`,
    example: 'keg docker image run <options>',
    options: {
      context: {
        alias: [ 'name' ],
        description: 'Name of the image to run',
        example: 'keg docker image run --context core'
      },
      cleanup: {
        alias: [ 'clean', 'rm' ],
        description: 'Auto remove the docker container after exiting',
        example: `keg docker image run  --cleanup false`,
        default: true
      },
      entry: {
        description: 'Overwrite entry of the image. Use escaped quotes for spaces ( bin/bas h)',
        example: 'keg docker image run --entry \\"node index.js\\"',
        default: '/bin/sh'
      },
      tag: {
        description: 'Tag of the image to be run',
        example: 'keg docker image run --context core --tag updates',
      }
    },
  }
}
