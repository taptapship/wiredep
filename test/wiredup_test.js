'use strict';

var fs = require('fs');
var wiredep = require('../wiredep');
var bowerJson = require('../.tmp/bower.json');

function testReplace(test, fileType) {
  var expectedPath = '.tmp/' + fileType + '/index-expected.' + fileType;
  var actualPath = '.tmp/' + fileType + '/index-actual.' + fileType;
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
}

function testReplaceWithExcludedsrc(test, fileType) {
  var expectedPath = '.tmp/'+ fileType + '/index-excluded-files-expected.' + fileType;
  var actualPath = '.tmp/' + fileType + '/index-excluded-files-actual.' + fileType;
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
}

exports.wiredep = {
  replaceHtml: function (test) {
    testReplace(test, 'html');
  },

  replaceJade: function (test) {
    testReplace(test, 'jade');
  },

  replaceYml: function (test) {
    testReplace(test, 'yml');
  },

  replaceHtmlWithExcludedsrc: function(test) {
    testReplaceWithExcludedsrc(test, 'html');
  },

  replaceJadeWithExcludedsrc: function(test) {
    testReplaceWithExcludedsrc(test, 'jade');
  },

  replaceYmlWithExcludedsrc: function(test) {
    testReplaceWithExcludedsrc(test, 'yml');
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
