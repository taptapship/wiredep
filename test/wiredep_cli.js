/*jshint latedef:false */
/*global after, describe, it, before */

'use strict';

var fs = require('fs-extra');
var path = require('path');
var assert = require('chai').assert;

describe('wiredep-cli', function () {
  before(function() {
    fs.copySync('test/fixture', '.tmp');
    process.chdir('.tmp');

    // this is required to prevent require from caching the CLI script
    delete require.cache[require.resolve('../wiredep-cli')];
  });
  after(function () {
    process.chdir('..');
    fs.removeSync('.tmp');
  });

  describe('replace functionality', function () {
    function testReplaceCli(args, filePaths) {

      process.argv = args;
      require('../wiredep-cli');

      assert.deepEqual(
        filePaths.read('expected').split('\n'),
        filePaths.read('actual').split('\n')
      );
    }

    it('should work with html and extra parameters, long notation', function() {
      var filePaths = getFilePaths('index', 'html');
      testReplaceCli(['foo', 'bar', '--src', filePaths.actual, '--bowerJson', 'bower.json'], filePaths);
    });

    it('should work with html and extra parameters, short notation', function() {
      var filePaths = getFilePaths('index', 'html');
      testReplaceCli(['foo', 'bar', '-s', filePaths.actual, '-b', 'bower.json'], filePaths);
    });
  });
});

function getFilePaths(fileName, fileType) {
  var extension = fileType.match(/([^/]*)[/]*/)[1];
  var filePaths = {
    expected: path.resolve(fileType, fileName + '-expected.' + extension),
    actual: path.resolve(fileType, fileName + '-actual.' + extension),
    read: function (type) {
      return fs.readFileSync(filePaths[type], { encoding: 'utf8' });
    }
  };

  return filePaths;
}
