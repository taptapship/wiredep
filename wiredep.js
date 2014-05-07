/*
 * wiredep
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */'use strict';

var fs = require('fs');
var glob = require('glob');
var helpers = require('./lib/helpers');
var path = require('path');
var through = require('through2');
var _ = require('lodash');
var strip = require('strip-comments');

var fileTypesDefault = {
  html : {
    block : /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
    detect : {
      js : /<script.*src=['"](.+)['"]>/gi,
      css : /<link.*href=['"](.+)['"]/gi
    },
    replace : {
      js : '<script src="{{filePath}}"></script>',
      css : '<link rel="stylesheet" href="{{filePath}}" />'
    }
  },

  jade : {
    block : /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect : {
      js : /script\(.*src=['"](.+)['"]>/gi,
      css : /link\(href=['"](.+)['"]/gi
    },
    replace : {
      js : 'script(src=\'{{filePath}}\')',
      css : 'link(rel=\'stylesheet\', href=\'{{filePath}}\')'
    }
  },

  less : {
    block : /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect : {
      css : /@import\s['"](.+)['"]/gi,
      less : /@import\s['"](.+)['"]/gi
    },
    replace : {
      css : '@import "{{filePath}}";',
      less : '@import "{{filePath}}";'
    }
  },

  sass : {
    block : /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect : {
      css : /@import\s['"](.+)['"]/gi,
      sass : /@import\s['"](.+)['"]/gi,
      scss : /@import\s['"](.+)['"]/gi
    },
    replace : {
      css : '@import {{filePath}}',
      sass : '@import {{filePath}}',
      scss : '@import {{filePath}}'
    }
  },

  scss : {
    block : /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
    detect : {
      css : /@import\s['"](.+)['"]/gi,
      sass : /@import\s['"](.+)['"]/gi,
      scss : /@import\s['"](.+)['"]/gi
    },
    replace : {
      css : '@import "{{filePath}}";',
      sass : '@import "{{filePath}}";',
      scss : '@import "{{filePath}}";'
    }
  },

  yaml : {
    block : /(([ \t]*)#\s*bower:*(\S*))(\n|\r|.)*?(#\s*endbower)/gi,
    detect : {
      js : /-\s(.+)/gi,
      css : /-\s(.+)/gi
    },
    replace : {
      js : '- {{filePath}}',
      css : '- {{filePath}}'
    }
  }
};

fileTypesDefault['default'] = fileTypesDefault.html;
fileTypesDefault.htm = fileTypesDefault.html;
fileTypesDefault.yml = fileTypesDefault.yaml;

function mergeFileTypesWithDefaults(optsFileTypes) {
  var fileTypes = _.clone(fileTypesDefault, true);

  _(optsFileTypes).each(function(fileTypeConfig, fileType) {
    fileTypes[fileType] = fileTypes[fileType] || {};
    _.each(fileTypeConfig, function(config, configKey) {
      if (_.isPlainObject(fileTypes[fileType][configKey])) {
        fileTypes[fileType][configKey] = _.assign(fileTypes[fileType][configKey], config);
      } else {
        fileTypes[fileType][configKey] = config;
      }
    });
  });

  return fileTypes;
}

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
var wiredep = function(opts) {
  opts = opts || {};

  var config = module.exports.config = helpers.createStore();

  config.set
  ('bower.json', opts.bowerJson || JSON.parse(fs.readFileSync('./bower.json')))
  ('bower-directory', opts.directory || 'bower_components')
  ('dependencies', opts.dependencies === false ? false : true)
  ('detectable-file-types', [])
  ('dev-dependencies', opts.devDependencies)
  ('exclude', opts.exclude)
  ('file-types', mergeFileTypesWithDefaults(opts.fileTypes))
  ('global-dependencies', helpers.createStore())
  ('ignore-path', opts.ignorePath)
  ('overrides', _.extend({}, config.get('bower.json').overrides, opts.overrides))
  ('src', [])
  ('stream', opts.stream ? opts.stream : {})('warnings', []);

  _.pluck(config.get('file-types'), 'detect').forEach(function(fileType) {
    Object.keys(fileType).forEach(function(detectableFileType) {
      var detectableFileTypes = config.get('detectable-file-types');

      if (detectableFileTypes.indexOf(detectableFileType) === -1) {
        config.set('detectable-file-types', detectableFileTypes.concat(detectableFileType));
      }
    });
  });

  if (!opts.stream && opts.src) {
    (Array.isArray(opts.src) ? opts.src : [opts.src]).forEach(function(pattern) {
      config.set('src', config.get('src').concat(glob.sync(pattern)));
    });
  }

  require('./lib/detect-dependencies')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }

  var ret = config.get('stream').src || Object.keys(config.get('global-dependencies-sorted')).reduce(function(acc, depType) {
    if (config.get('global-dependencies-sorted')[depType].length) {
      var deps = config.get('global-dependencies-sorted')[depType];
      if (depType === 'js') {
        var angularModules = [];
        _.each(deps, function(dep) {
          var file = fs.readFileSync('./' + dep, 'UTF8');
          file = strip(file);

          var angularModuleRegex = /angular.module\([\"\']([a-zA-Z0-9\-]*)[\"\']\, ?\[/g;
          var match = angularModuleRegex.exec(file);
          while (match) {
            angularModules.push(match[1]);
            match = angularModuleRegex.exec(file);
          }
        });
        acc['angular'] = angularModules;
      }
      acc[depType] = deps;
    }

    return acc;
  }, {
    packages : config.get('global-dependencies').get()
  });
  return ret;
};

wiredep.stream = function(opts) {
  opts = opts || {};

  return through.obj(function(file, enc, cb) {
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
        src : file.contents.toString(),
        path : file.path,
        fileType : path.extname(file.path).substr(1)
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
