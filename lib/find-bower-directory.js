'use strict';

var $ = {
  'bower-config': require('bower-config'),
  chalk: require('chalk'),
  fs: require('fs'),
  path: require('path')
};


function findBowerDirectory(cwd) {
  var directory = $.path.join(cwd, ($['bower-config'].read(cwd).directory || 'bower_components'));

  if (!$.fs.existsSync(directory)) {
    console.log($.chalk.red.bold('Cannot find where you keep your Bower packages.'));

    process.exit();
  }

  return directory;
}

module.exports = findBowerDirectory;
