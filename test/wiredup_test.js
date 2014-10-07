/*jshint latedef:false */
/*global after, describe, it */

'use strict';

var fs = require('fs-extra');
var path = require('path');
var assert = require('assert');
var wiredep = require('../require-wiredep');

describe('require-wiredep', function () {
  fs.copySync('test/fixture', '.tmp');
  process.chdir('.tmp');
  after(fs.remove.bind({}, '../.tmp'));

  describe('replace functionality', function () {
    function testReplace(fileType) {
      return function () {
        var filePaths = getFilePaths('index', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should work with js files', testReplace('js'));

    it('should support globbing', function () {
      wiredep({ src: ['js/index-actual.*'] });

      [
        {
          actual: 'js/index-actual.js',
          expected: 'js/index-expected.js'
        }
      ].forEach(function (testObject) {
        assert.equal(
          fs.readFileSync(testObject.actual, { encoding: 'utf8' }),
          fs.readFileSync(testObject.expected, { encoding: 'utf8' })
        );
      });
    });
  });

  describe('second run (identical files)', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-second-run', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should replace js after second run', testFn('js'));
  });

  describe('inject specify property', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-specify-property', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject specify property to js code', testFn('js'));
  });

  describe('extend default value', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-extend-property', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject specify property to js code', testFn('js'));
  });

  describe('add url prefix', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-prefix', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject require config with prefix to js code', testFn('js'));
  });

  describe('exclude url prefix', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-prefix-exclude', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject require config with prefix without exclude url', testFn('js'));
  });

  describe('add url postfix', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-postfix', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject require config with postfix to js code', testFn('js'));
  });

  describe('exclude url postfix', function () {
    function testFn(fileType) {
      return function () {
        var filePaths = getFilePaths('index-postfix-exclude', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should inject require config with postfix without exclude url', testFn('js'));
  });

  it('should support passing requireJson to wiredep', function () {
    var filePaths = getFilePaths('another-require', 'js');

    wiredep({
      requireJson: JSON.parse(fs.readFileSync('./require_another.json')),
      src: [filePaths.actual]
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
  });

  it('should support inclusion of main files from require.json in some other dir', function () {
    var filePaths = getFilePaths('cwd', 'js');

    wiredep({
      src: [filePaths.actual],
      cwd: 'cwd'
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
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
