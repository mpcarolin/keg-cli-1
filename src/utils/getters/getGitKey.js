const { get } = require('jsutils')
const { BUILD_ARGS, GLOBAL_CONFIG_PATHS } = require('KegConst')

/**
 * Gets the git key to allow cloning private repos
 * Pulls from the ENV GIT_KEY or global config
 * @param {Object} globalConfig - Global config object for the Keg CLI
 *
 * @returns {string} - Found git key
 */
const getGitKey = globalConfig => {
  return process.env[ BUILD_ARGS.GIT_KEY ] ||
    get(globalConfig, `${GLOBAL_CONFIG_PATHS.GIT}.key`) ||
    (() => { throw new Error(`Git key not configured in the global config!`) })()
}

module.exports = {
  getGitKey
}