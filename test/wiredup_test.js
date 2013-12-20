'use strict';

var wiredep = require('../bin/wiredep');
var fs = require('fs');
var bowerJson = require('../.tmp/bower.json');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.wiredep = {
  replaceHtml: function (test) {
    var expectedPath = '.tmp/index-expected.html';
    var actualPath = '.tmp/index-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },
  replaceHtmlWithExcludedFiles: function(test) {
    var expectedPath = '.tmp/index-excluded-files-expected.html';
    var actualPath = '.tmp/index-excluded-files-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/',
      exclude: [ 'bower_components/bootstrap/dist/js/bootstrap.js', /codecode/ ]
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },
  replaceYmlWithCustomFormat: function(test) {
    var expectedPath = '.tmp/yml-custom-format-expected.yml',
        actualPath = '.tmp/yml-custom-format-actual.yml',
        expected = String(fs.readFileSync(expectedPath)),
        actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerPattern: /(([\s\t]*)#\s*bower:*(\S*)\s*)(\n|\r|.)*?(#\s*endbower\s*)/gi,
      bowerJson: bowerJson,
      file: actualPath,
      ignorePath: '.tmp/',
      jsPattern: '- {{filePath}}'
    });

    actual = String(fs.readFileSync(actualPath));
    test.equal(actual, expected);
    test.done();
  },
  replaceFileWithBowerPatternAsString: function(test) {
    var expectedPath = '.tmp/file-custom-format-expected.yml',
        actualPath = '.tmp/file-custom-format-actual.yml',
        expected = String(fs.readFileSync(expectedPath)),
        actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerPattern: 'yml',
      bowerJson: bowerJson,
      file: actualPath,
      ignorePath: '.tmp/',
      jsPattern: '- {{filePath}}'
    });

    actual = String(fs.readFileSync(actualPath));
    test.equal(actual, expected);
    test.done();
  },
  replaceHtmlWithCustomFormat: function (test) {
    var expectedPath = '.tmp/index-custom-format-expected.html';
    var actualPath = '.tmp/index-custom-format-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/',
      jsPattern: '<script type="text/javascript" src="{{filePath}}"> </script>',
      cssPattern: '<link href="{{filePath}}" rel="stylesheet">'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },
  replaceHtmlAfterUninstalledPackage: function (test) {
    var expectedPath = '.tmp/index-after-uninstall-expected.html';
    var actualPath = '.tmp/index-after-uninstall-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall.json'),
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },
  replaceHtmlAfterUninstallingAllPackages: function (test) {
    var expectedPath = '.tmp/index-after-uninstall-all-expected.html';
    var actualPath = '.tmp/index-after-uninstall-all-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall_all.json'),
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  }
};
