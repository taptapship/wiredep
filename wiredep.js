/*
 * wiredep
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var glob = require('glob');
var helpers = require('./lib/helpers');

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
module.exports = function (opts) {
  var config = helpers.createStore();

  config.set
    ('bower.json', opts.bowerJson)
    ('bower-directory', opts.directory)
    ('dependencies', opts.dependencies === false ? false : true)
    ('dev-dependencies', opts.devDependencies)
    ('exclude', opts.exclude)
    ('file-types', opts.fileTypes)
    ('global-dependencies', helpers.createStore())
    ('ignore-path', opts.ignorePath)
    ('src', [])
    ('warnings', []);

  (Array.isArray(opts.src) ? opts.src : [opts.src]).
    forEach(function (pattern) {
      config.set('src', config.get('src').concat(glob.sync(pattern)));
    });

  require('./lib/detect-dependencies')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }
};
