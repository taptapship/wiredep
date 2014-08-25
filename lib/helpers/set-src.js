'use strict';

var $ = require('modmod')('glob');


function setSrc(config, opts) {

  if (!opts.stream && opts.src) {
    (Array.isArray(opts.src) ? opts.src : [opts.src]).
      forEach(function (pattern) {
        config.set('src', config.get('src').concat($.glob.sync(pattern)));
      });
  }

}

module.exports = setSrc;
