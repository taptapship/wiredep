'use strict';

var $ = require('modmod')('path', 'through2');


module.exports = function wiredepStream(opts) {
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

      file.contents = new Buffer(require('../wiredep')(opts));
    } catch (err) {
      this.emit('error', err);
    }

    this.push(file);
    cb();
  });
};

