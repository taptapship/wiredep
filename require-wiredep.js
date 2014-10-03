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
function wiredep(opts) {
  opts = opts || {};

  var cwd = opts.cwd ? $.path.resolve(opts.cwd) : process.cwd();

  var config = module.exports.config = helpers.createStore();

  config.set
    ('require.json', opts.requireJson || JSON.parse($.fs.readFileSync($.path.join(cwd, './require.json'))))
    ('cwd', cwd)
    ('detectable-file-types', [])
    ('exclude', Array.isArray(opts.exclude) ? opts.exclude : [ opts.exclude ])
    ('file-types', mergeFileTypesWithDefaults(opts.fileTypes))
    ('ignore-path', opts.ignorePath)
    ('src', [])
    ('stream', opts.stream ? opts.stream : {})
    ('warnings', []);

  if (!opts.stream && opts.src) {
    (Array.isArray(opts.src) ? opts.src : [opts.src]).
      forEach(function (pattern) {
        config.set('src', config.get('src').concat($.glob.sync(pattern)));
      });
  }

  console.log("OPT-SRC", opts.src);
  console.log("SRC", config.get('src'));

  require('./lib/require-structure-generator')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }

  // return config.get('stream').src ||
  //   Object.keys(config.get('global-dependencies-sorted')).
  //     reduce(function (acc, depType) {
  //       if (config.get('global-dependencies-sorted')[depType].length) {
  //         acc[depType] = config.get('global-dependencies-sorted')[depType];
  //       }

  //       return acc;
  //     }, { packages: config.get('global-dependencies').get() });
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

wiredep.stream = function (opts) {
  opts = opts || {};

  return $.through2.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', 'Streaming not supported');
      return cb();
    }

    try {
      opts.stream = {
        src: file.contents.toString(),
        path: file.path,
        fileType: $.path.extname(file.path).substr(1)
      };

      file.contents = new Buffer(wiredep(opts));
    } catch (err) {
      this.emit('error', err);
    }

    this.push(file);
    cb();
  });
};


module.exports = wiredep;
