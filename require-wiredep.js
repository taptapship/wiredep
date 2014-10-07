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
var fileTypesDefault = require('./lib/default-file-types');

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
function require_wiredep(opts) {
  opts = opts || {};

  var cwd = opts.cwd ? $.path.resolve(opts.cwd) : process.cwd();
  var config = module.exports.config = helpers.createStore();
  var requirePath = $.path.join(cwd, './require.json');
  var requireJson;

  if (!!opts.requireUrl) {
    requireJson = JSON.parse($.fs.readFileSync($.path.join(cwd, opts.requireUrl)));    
  } else if (!!opts.requireJson) {
    requireJson = opts.requireJson;
  } else if ($.fs.existsSync(requirePath)) {
    requireJson = JSON.parse($.fs.readFileSync(requirePath));
  }

  config.set
    ('require.json', requireJson)
    ('cwd', cwd)
    ('detectable-file-types', [])
    ('file-types', mergeFileTypesWithDefaults(opts.fileTypes))
    ('src', [])
    ('stream', opts.stream ? opts.stream : {})
    ('warnings', []);

  if (!opts.stream && opts.src) {
    (Array.isArray(opts.src) ? opts.src : [opts.src]).
      forEach(function (pattern) {
        config.set('src', config.get('src').concat($.glob.sync(pattern)));
      });
  }

  require('./lib/require-structure-generator')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }

  return true;
}

function mergeFileTypesWithDefaults(optsFileTypes) {
  var fileTypes = $._.clone(fileTypesDefault, true);

  $._(optsFileTypes).each(function (fileTypeConfig, fileType) {
    fileTypes[fileType] = fileTypes[fileType] || {};
    $._.each(fileTypeConfig, function (config, configKey) {
      if ($._.isPlainObject(fileTypes[fileType][configKey])) {
        fileTypes[fileType][configKey] =
          $._.assign(fileTypes[fileType][configKey], config);
      } else {
        fileTypes[fileType][configKey] = config;
      }
    });
  });

  return fileTypes;
}


module.exports = require_wiredep;
