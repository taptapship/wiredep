/*jshint latedef:false */
/*global after, describe, it, before, after */

'use strict';

var fs = require('fs-extra');
var resolve = require('path').resolve;
var assert = require('chai').assert;
var sinon = require('sinon');

describe('wiredep-cli', function () {

  function reset () {
    delete require.cache[require.resolve('../wiredep-cli')];
  }

  describe('replace functionality', function () {
    before(function () {
      fs.copySync('test/fixture', '.tmp');
      process.chdir('.tmp');
    });

    after(function () {
      process.chdir('..');
      fs.removeSync('.tmp');
    });

    function runCli (arg) {
      var src = getFilePaths('index', 'html');

      reset();
      process.argv = ['', '', arg[0], src.actual, arg[1], 'bower.json'];
      require('../wiredep-cli');

      assert.deepEqual(
        src.read('expected').split('\n'),
        src.read('actual').split('\n')
      );
    }

    it('should work with long notation', runCli.bind(this,
      ['--src', '--bowerJson'])
    );

    it('should work with short notation', runCli.bind(this, ['-s', '-b']));
  });

  describe('argument checks', function () {
    function runLog (args, errMsg) {
      var stub = sinon.stub(console, 'log');

      reset();
      process.argv = ['', ''].concat(args);
      require('../wiredep-cli');

      assert(stub.calledOnce, 'Console.log was not called');
      assert(stub.calledWithMatch(errMsg), 'Message did not match');
      stub.restore();
    }

    it('should return the version', function () {
      var version = require('../package.json').version;
      runLog(['-v'], version);
      runLog(['--version'], version);
    });

    it('should display help when called with no args or help ones', function () {
      [[], ['-h'], ['--help']].forEach(function (arg) {
        runLog(arg, /^Wire Bower dependencies to your source code/);
      });
    });

    it('should log when source is not specified', function () {
      var msg = /Source file not specified/;
      runLog(['-b', 'bower.json'], msg);
      runLog(['--bowerJson', 'bower.json'], msg);
    });
  });
});

function getFilePaths (fileName, fileType) {
  var extension = fileType.match(/([^/]*)[/]*/)[1];
  var filePaths = {
    expected: resolve(fileType, fileName + '-expected.' + extension),
    actual: resolve(fileType, fileName + '-actual.' + extension),
    read: function (type) {
      return fs.readFileSync(filePaths[type], { encoding: 'utf8' });
    }
  };

  return filePaths;
}
