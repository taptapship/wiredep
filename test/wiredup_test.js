'use strict';

var fs = require('fs');
var wiredep = require('../wiredep');
var bowerJson = require('../.tmp/bower.json');

exports.wiredep = {
  replaceHtml: function (test) {
    var expectedPath = '.tmp/html/index-expected.html';
    var actualPath = '.tmp/html/index-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceYml: function (test) {
    var expectedPath = '.tmp/yml/index-expected.yml';
    var actualPath = '.tmp/yml/index-actual.yml';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  /**
   * When an unrecognized file type is sent in, it should be treated like an
   * HTML file.
   */
  replaceUnrecognizedFileType: function (test) {
    var expectedPath = '.tmp/unrecognized/index-expected.sps';
    var actualPath = '.tmp/unrecognized/index-actual.sps';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceHtmlWithExcludedsrc: function(test) {
    var expectedPath = '.tmp/html/index-excluded-files-expected.html';
    var actualPath = '.tmp/html/index-excluded-files-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/',
      exclude: [ 'bower_components/bootstrap/dist/js/bootstrap.js', /codecode/ ]
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceYmlWithExcludedsrc: function(test) {
    var expectedPath = '.tmp/yml/index-excluded-files-expected.yml';
    var actualPath = '.tmp/yml/index-excluded-files-actual.yml';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/',
      exclude: [ 'bower_components/bootstrap/dist/js/bootstrap.js', /codecode/ ]
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceHtmlWithCustomFormat: function (test) {
    var expectedPath = '.tmp/html/index-custom-format-expected.html';
    var actualPath = '.tmp/html/index-custom-format-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/',
      fileTypes: {
        html: {
          replace: {
            js: '<script type="text/javascript" src="{{filePath}}"></script>',
            css: '<link href="{{filePath}}" rel="stylesheet">'
          }
        }
      }
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceYmlWithCustomFormat: function(test) {
    var expectedPath = '.tmp/yml/index-custom-format-expected.yml';
    var actualPath = '.tmp/yml/index-custom-format-actual.yml';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/',
      fileTypes: {
        yml: {
          replace: {
            css: '- "{{filePath}}" #css',
            js: '- "{{filePath}}"'
          }
        }
      }
    });

    actual = String(fs.readFileSync(actualPath));
    test.equal(actual, expected);
    test.done();
  },

  replaceHtmlAfterUninstalledPackage: function (test) {
    var expectedPath = '.tmp/html/index-after-uninstall-expected.html';
    var actualPath = '.tmp/html/index-after-uninstall-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall.json'),
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  },

  replaceHtmlAfterUninstallingAllPackages: function (test) {
    var expectedPath = '.tmp/html/index-after-uninstall-all-expected.html';
    var actualPath = '.tmp/html/index-after-uninstall-all-actual.html';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall_all.json'),
      src: [actualPath],
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  }
};
