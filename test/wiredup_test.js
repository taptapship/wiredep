'use strict';

var fs = require('fs');
var wiredep = require('../wiredep');
var bowerJson = require('../.tmp/bower.json');

function filePath(prefix, isExpected, fileType) {
  return '.tmp/' + fileType + '/' +
    prefix + (isExpected ? '-expected.' : '-actual.') + fileType;
}

function testReplace(test, fileType) {
  var expectedPath = filePath('index', true, fileType);
  var actualPath = filePath('index', false, fileType);
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
  var expectedPath = filePath('index-excluded-files', true, fileType);
  var actualPath = filePath('index-excluded-files', false, fileType);
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

function testReplaceAfterUninstalledPackage(test, fileType) {
  var expectedPath = filePath('index-after-uninstall', true, fileType);
  var actualPath = filePath('index-after-uninstall', false, fileType);
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
}

function testReplaceAfterUninstallingAllPackages(test, fileType) {
  var expectedPath = filePath('index-after-uninstall-all', true, fileType);
  var actualPath = filePath('index-after-uninstall-all', false, fileType);
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

  replaceJadeWithCustomFormat: function (test) {
    var expectedPath = '.tmp/jade/index-custom-format-expected.jade';
    var actualPath = '.tmp/jade/index-custom-format-actual.jade';
    var expected = String(fs.readFileSync(expectedPath));
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [actualPath],
      ignorePath: '.tmp/',
      fileTypes: {
        jade: {
          replace: {
            js: 'script(type=\'text/javascript\', src=\'{{filePath}}\')',
            css: 'link(href=\'{{filePath}}\', rel=\'stylesheet\')'
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
    testReplaceAfterUninstalledPackage(test, 'html');
  },

  replaceJadeAfterUninstalledPackage: function (test) {
    testReplaceAfterUninstalledPackage(test, 'jade');
  },

  replaceHtmlAfterUninstallingAllPackages: function (test) {
    testReplaceAfterUninstallingAllPackages(test, 'html');
  },

  replaceJadeAfterUninstallingAllPackages: function (test) {
    testReplaceAfterUninstallingAllPackages(test, 'jade');
  }
};
