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
    var stub;
    before(function () {
      fs.copySync('test/fixture', '.tmp');
      process.chdir('.tmp');
      stub = sinon.stub(console, 'warn');
    });

    after(function () {
      process.chdir('..');
      fs.removeSync('.tmp');
      stub.restore();
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
    function runLog (args, errMsg, method) {
      var stub = sinon.stub(console, method);

      reset();
      process.argv = ['', ''].concat(args);
      require('../wiredep-cli');

      assert(stub.calledOnce, 'Console.' + method + ' was not called');
      assert(stub.calledWithMatch(errMsg), 'Message did not match');
      stub.restore();
    }

    it('should return the version', function () {
      var version = require('../package.json').version;
      runLog(['-v'], version, 'info');
      runLog(['--version'], version, 'info');
    });

    it('should display help when called with no args or help ones', function () {
      [[], ['-h'], ['--help']].forEach(function (arg) {
        runLog(arg, /^Wire Bower dependencies to your source code/, 'info');
      });
    });

    it('should error when source is not specified', function () {
      var msg = /Source file not specified/;
      runLog(['-b', 'bower.json'], msg, 'error');
      runLog(['--bowerJson', 'bower.json'], msg, 'error');
    });

    it('should message when the requested file not found', function () {
      var stub = sinon.stub(console, 'error');
      var warnMsg = '> Could not find `no.json`';
      runLog(['-s', 'foo', '-b', 'no.json'], warnMsg, 'warn');
      runLog(['-s', 'foo', '--bowerJson', 'no.json'], warnMsg, 'warn');
      stub.restore();

      stub = sinon.stub(console, 'warn');
      var errMsg = /bower.json not found/;
      runLog(['-s', 'foo', '-b', 'no.json'], errMsg, 'error');
      runLog(['-s', 'foo', '--bowerJson', 'no.json'], errMsg, 'error');
      stub.restore();
    });

    it('should message when the requested file is invalid', function () {
      var file = resolve('test/fixture/invalid.json');
      var stub = sinon.stub(console, 'error');
      var warnMsg = '> Invalid';
      runLog(['-s', 'foo', '-b', file], warnMsg, 'warn');
      runLog(['-s', 'foo', '--bowerJson', file], warnMsg, 'warn');
      stub.restore();

      stub = sinon.stub(console, 'warn');
      var errMsg = /bower.json not found/;
      runLog(['-s', 'foo', '-b', file], errMsg, 'error');
      runLog(['-s', 'foo', '--bowerJson', file], errMsg, 'error');
      stub.restore();
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
