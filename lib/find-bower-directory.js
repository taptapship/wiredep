'use strict';

var $ = require('modmod')('bower-config', 'chalk', 'fs', 'path');


function findBowerDirectory(cwd) {
  var directory = $.path.join(cwd, ($['bower-config'].read(cwd).directory || 'bower_components'));

  if (!$.fs.existsSync(directory)) {
    console.log($.chalk.red.bold('Cannot find where you keep your Bower packages.'));

    process.exit();
  }

  return directory;
}

module.exports = findBowerDirectory;
