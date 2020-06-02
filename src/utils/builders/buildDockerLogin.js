const { get, reduceObj } = require('jsutils')
const { getGlobalConfig } = require('../globalConfig/getGlobalConfig')
const { getGitKey } = require('../git/getGitKey')
const { getGitConfigItem } = require('../git/getGitConfigItem')
const { throwDockerCreds } = require('../error/throwDockerCreds')

/**
 * Validates the login creds to ensure all keys exist
 * @function
 * @param {creds} - Creds passed in from the command line
 * @param {string} creds.provider - The url used to log into the provider
 * @param {string} creds.user - User used to login to the provider
 * @param {string} creds.token - Auth token for the docker registry provider
 *
 * @returns {Object} - The built login creds
 */
const validateLoginCreds = creds => {
  return reduceObj(creds, (key, value, validated) => {
    !value && throwDockerCreds(creds, key)

    return creds
  }, creds)
}

/**
 * Builds the login creds for a docker registry provider
 * @function
 * @param {creds} - Creds passed in from the command line
 * @param {string} creds.provider - The url used to log into the provider
 * @param {string} creds.user - User used to login to the provider
 * @param {string} creds.token - Auth token for the docker registry provider
 *
 * @returns {Object} - The built login creds
 */
const buildDockerLogin = async ({ user, token, provider }) => {
  const globalConfig = getGlobalConfig()
  const gitUser = user || await getGitConfigItem('user.name')

  return validateLoginCreds({
    token: token || await getGitKey(globalConfig),
    user: gitUser || get(globalConfig, 'docker.user'),
    providerUrl: provider || get(globalConfig, 'docker.providerUrl'),
  })

}

module.exports = {
  buildDockerLogin
}