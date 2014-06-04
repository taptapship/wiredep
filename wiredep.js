/*
 * wiredep
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var glob = require('glob');
var helpers = require('./lib/helpers');
var path = require('path');
var through = require('through2');
var _ = require('lodash');
var bowerConfig = require('bower-config');
var chalk = require('chalk');

var fileTypesDefault = {
  html: {
    block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
    detect: {
      js: /<script.*src=['"]([^'"]+)/gi,
      css: /<link.*href=['"]([^'"]+)/gi
    },
    replace: {
      js: '<script src="{{filePath}}"></script>',
      css: '<link rel="stylesheet" href="{{filePath}}" />'
    }
  },

  jade: {
    block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect: {
      js: /script\(.*src=['"]([^'"]+)/gi,
      css: /link\(.*href=['"]([^'"]+)/gi
    },
    replace: {
      js: 'script(src=\'{{filePath}}\')',
      css: 'link(rel=\'stylesheet\', href=\'{{filePath}}\')'
    }
  },

  less: {
    block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect: {
      css: /@import\s['"](.+css)['"]/gi,
      less: /@import\s['"](.+less)['"]/gi
    },
    replace: {
      css: '@import "{{filePath}}";',
      less: '@import "{{filePath}}";'
    }
  },

  sass: {
    block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect: {
      css: /@import\s(.+css)/gi,
      sass: /@import\s(.+sass)/gi,
      scss: /@import\s(.+scss)/gi
    },
    replace: {
      css: '@import {{filePath}}',
      sass: '@import {{filePath}}',
      scss: '@import {{filePath}}'
    }
  },

  scss: {
    block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect: {
      css: /@import\s['"](.+css)['"]/gi,
      sass: /@import\s['"](.+sass)['"]/gi,
      scss: /@import\s['"](.+scss)['"]/gi
    },
    replace: {
      css: '@import "{{filePath}}";',
      sass: '@import "{{filePath}}";',
      scss: '@import "{{filePath}}";'
    }
  },

  yaml: {
    block: /(([ \t]*)#\s*bower:*(\S*))(\n|\r|.)*?(#\s*endbower)/gi,
    detect: {
      js: /-\s(.+js)/gi,
      css: /-\s(.+css)/gi
    },
    replace: {
      js: '- {{filePath}}',
      css: '- {{filePath}}'
    }
  }
};

fileTypesDefault['default'] = fileTypesDefault.html;
fileTypesDefault.htm = fileTypesDefault.html;
fileTypesDefault.yml = fileTypesDefault.yaml;

function mergeFileTypesWithDefaults(optsFileTypes) {
  var fileTypes = _.clone(fileTypesDefault, true);

  _(optsFileTypes).each(function (fileTypeConfig, fileType) {
    fileTypes[fileType] = fileTypes[fileType] || {};
    _.each(fileTypeConfig, function (config, configKey) {
      if (_.isPlainObject(fileTypes[fileType][configKey])) {
        fileTypes[fileType][configKey] =
          _.assign(fileTypes[fileType][configKey], config);
      } else {
        fileTypes[fileType][configKey] = config;
      }
    });
  });

  return fileTypes;
}

function findBowerDirectory(cwd) {
  var directory = path.join(cwd, (bowerConfig.read(cwd).directory || 'bower_components'));

  if (!fs.existsSync(directory)) {
    console.log(chalk.red.bold('Cannot find where you keep your Bower packages.'));

    process.exit();
  }

  return directory;
}

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
var wiredep = function (opts) {
  opts = opts || {};

  var cwd = opts.cwd || process.cwd();

  var config = module.exports.config = helpers.createStore();

  config.set
    ('bower.json', opts.bowerJson || JSON.parse(fs.readFileSync(path.join(cwd, './bower.json'))))
    ('bower-directory', opts.directory || findBowerDirectory(cwd))
    ('dependencies', opts.dependencies === false ? false : true)
    ('detectable-file-types', [])
    ('dev-dependencies', opts.devDependencies)
    ('exclude', Array.isArray(opts.exclude) ? opts.exclude : [ opts.exclude ])
    ('file-types', mergeFileTypesWithDefaults(opts.fileTypes))
    ('global-dependencies', helpers.createStore())
    ('ignore-path', opts.ignorePath)
    ('overrides', _.extend({}, config.get('bower.json').overrides, opts.overrides))
    ('src', [])
    ('stream', opts.stream ? opts.stream : {})
    ('warnings', []);

  _.pluck(config.get('file-types'), 'detect').
    forEach(function (fileType) {
      Object.keys(fileType).
        forEach(function (detectableFileType) {
          var detectableFileTypes = config.get('detectable-file-types');

          if (detectableFileTypes.indexOf(detectableFileType) === -1) {
            config.set('detectable-file-types', detectableFileTypes.concat(detectableFileType));
          }
        });
    });

  if (!opts.stream && opts.src) {
    (Array.isArray(opts.src) ? opts.src : [opts.src]).
      forEach(function (pattern) {
        config.set('src', config.get('src').concat(glob.sync(pattern)));
      });
  }

  require('./lib/detect-dependencies')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }

  return config.get('stream').src ||
    Object.keys(config.get('global-dependencies-sorted')).
      reduce(function (acc, depType) {
        if (config.get('global-dependencies-sorted')[depType].length) {
          acc[depType] = config.get('global-dependencies-sorted')[depType];
        }

        return acc;
      }, { packages: config.get('global-dependencies').get() });
};

wiredep.stream = function (opts) {
  opts = opts || {};

  return through.obj(function (file, enc, cb) {
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
        fileType: path.extname(file.path).substr(1)
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
