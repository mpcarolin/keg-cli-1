module.exports = {
  config: {
    name: 'config',
    alias: [ 'conf' ],
    tasks: {
      ...require('./editor'),
      ...require('./open'),
      ...require('./print'),
      ...require('./set'),
      ...require('./sync'),
      ...require('./update'),
    },
    description: 'Keg CLI config specific tasks',
    example: 'keg config <command> <options>'
  }
}
