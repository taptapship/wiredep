'use strict';

var $ = {
  _: require('lodash'),
  'bower-config': require('bower-config'),
  chalk: require('chalk'),
  fs: require('fs'),
  glob: require('glob'),
  lodash: require('lodash'),
  path: require('path'),
  through2: require('through2')
};

var helpers = require('./lib/helpers');
var findBowerDirectory = require('./lib/find-bower-directory');
var mergeFileTypesWithDefaults = require('./lib/merge-file-types-with-defaults');

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
function wiredep(opts) {
  opts = opts || {};

  var cwd = opts.cwd ? $.path.resolve(opts.cwd) : process.cwd();

  var config = module.exports.config = helpers.createStore();

  config.set
    ('bower.json', opts.bowerJson || JSON.parse($.fs.readFileSync($.path.join(cwd, './bower.json'))))
    ('bower-directory', opts.directory || findBowerDirectory(cwd))
    ('cwd', cwd)
    ('dependencies', opts.dependencies === false ? false : true)
    ('detectable-file-types', [])
    ('dev-dependencies', opts.devDependencies)
    ('exclude', Array.isArray(opts.exclude) ? opts.exclude : [ opts.exclude ])
    ('file-types', mergeFileTypesWithDefaults(opts.fileTypes))
    ('global-dependencies', helpers.createStore())
    ('ignore-path', opts.ignorePath)
    ('include-self', opts.includeSelf)
    ('overrides', $._.extend({}, config.get('bower.json').overrides, opts.overrides))
    ('src', [])
    ('stream', opts.stream ? opts.stream : {})
    ('warnings', []);

  require('./lib/helpers/set-detectable-file-types')(config);
  require('./lib/helpers/set-src')(config, opts);
  require('./lib/detect-dependencies')(config);
  require('./lib/inject-dependencies')(config);
  require('./lib/helpers/log-warnings')(config);

  return config.get('stream').src ||
    Object.keys(config.get('global-dependencies-sorted')).
      reduce(function (acc, depType) {
        if (config.get('global-dependencies-sorted')[depType].length) {
          acc[depType] = config.get('global-dependencies-sorted')[depType];
        }

        return acc;
      }, { packages: config.get('global-dependencies').get() });
}

wiredep.stream = require('./lib/wiredep-stream');

module.exports = wiredep;
