/*
 * wiredep
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var helpers = require('./lib/helpers');

/**
 * Wire up the html files with the Bower packages.
 *
 * @param  {object} config  the global configuration object
 */
module.exports = function (opts) {
  var config = helpers.createStore();

  config.set
    ('warnings', [])
    ('global-dependencies', helpers.createStore())
    ('src', Array.isArray(opts.src) ? opts.src : [opts.src])
    ('bower.json', opts.bowerJson)
    ('bower-directory', opts.directory)
    ('file-types', opts.fileTypes)
    ('ignore-path', opts.ignorePath)
    ('exclude', opts.exclude);

  require('./lib/detect-dependencies')(config);
  require('./lib/inject-dependencies')(config);

  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }
};
