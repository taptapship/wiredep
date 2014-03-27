'use strict';

var fs = require('fs');
var path = require('path');
var wiredep = require('../wiredep');
var bowerJson = require('../.tmp/bower.json');

function getFilePaths(fileName, fileType) {
  var extension = fileType.match(/([^/]*)[/]*/)[1];
  var filePaths = {
    expected: path.resolve('.tmp', fileType, fileName + '-expected.' + extension),
    actual: path.resolve('.tmp', fileType, fileName + '-actual.' + extension),
    read: function (type) {
      return String(fs.readFileSync(filePaths[type]));
    }
  };

  return filePaths;
}

function testReplace(fileType) {
  return function (test) {
    var filePaths = getFilePaths('index', fileType);

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  };
}

function testReplaceWithExcludedsrc(fileType) {
  return function (test) {
    var filePaths = getFilePaths('index-excluded-files', fileType);

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
      ignorePath: '.tmp/',
      exclude: [ 'bower_components/bootstrap/dist/js/bootstrap.js', /codecode/ ]
    });

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  };
}

function testReplaceAfterUninstalledPackage(fileType) {
  return function (test) {
    var filePaths = getFilePaths('index-after-uninstall', fileType);

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall.json'),
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    test.equal(filePaths.read('expected'), filePaths.read('actual'));

    test.done();
  };
}

function testReplaceAfterUninstallingAllPackages(fileType) {
  return function (test) {
    var filePaths = getFilePaths('index-after-uninstall-all', fileType);

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_after_uninstall_all.json'),
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    test.equal(filePaths.read('expected'), filePaths.read('actual'));

    test.done();
  };
}

exports.wiredep = {
  globbing: function (test) {
    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [
        '.tmp/html/index-actual.*',
        '.tmp/jade/index-actual.*'
      ],
      ignorePath: '.tmp/'
    });

    [
      {
        actual: '.tmp/html/index-actual.html',
        expected: '.tmp/html/index-expected.html'
      },
      {
        actual: '.tmp/jade/index-actual.jade',
        expected: '.tmp/jade/index-expected.jade'
      }
    ].forEach(function (testObject) {
      test.equal(
        String(fs.readFileSync(testObject.actual)),
        String(fs.readFileSync(testObject.expected))
      );
    });

    test.done();
  },

  replaceHtml: testReplace('html'),
  replaceJade: testReplace('jade'),
  replaceLess: testReplace('less'),
  replaceSass: testReplace('sass'),
  replaceScss: testReplace('scss'),
  replaceYml: testReplace('yml'),

  replaceUnrecognizedFileType: testReplace('unrecognized'),

  replaceHtmlWithExcludedsrc: testReplaceWithExcludedsrc('html'),
  replaceJadeWithExcludedsrc: testReplaceWithExcludedsrc('jade'),
  replaceYmlWithExcludedsrc: testReplaceWithExcludedsrc('yml'),

  replaceHtmlAfterUninstalledPackage: testReplaceAfterUninstalledPackage('html'),
  replaceJadeAfterUninstalledPackage: testReplaceAfterUninstalledPackage('jade'),

  replaceHtmlAfterUninstallingAllPackages: testReplaceAfterUninstallingAllPackages('html'),
  replaceJadeAfterUninstallingAllPackages: testReplaceAfterUninstallingAllPackages('jade'),

  replaceHtmlWithCustomFormat: function (test) {
    var filePaths = getFilePaths('index-custom-format', 'html');

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
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

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  },

  replaceJadeWithCustomFormat: function (test) {
    var filePaths = getFilePaths('index-custom-format', 'jade');

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
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

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  },

  replaceYmlWithCustomFormat: function (test) {
    var filePaths = getFilePaths('index-custom-format', 'yml');

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      src: [filePaths.actual],
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

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  },

  wireDevDependencies: function (test) {
    var filePaths = getFilePaths('index-with-dev-dependencies', 'html');

    wiredep({
      directory: '.tmp/bower_components',
      dependencies: false,
      devDependencies: true,
      bowerJson: bowerJson,
      src: [filePaths.actual],
      ignorePath: '.tmp/'
    });

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  },

  replaceHtmlWithPackageWithoutMain: function (test) {
    var filePaths = getFilePaths('index-packages-without-main', 'html');

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: require('../.tmp/bower_packages_without_main.json'),
      src: [filePaths.actual],
      ignorePath: '.tmp/',
      exclude: [ 'fake-package-without-main-and-confusing-file-tree' ]
    });

    // If a package is excluded, don't display a warning.
    test.equal(wiredep.config.get('warnings').length, 0);

    test.equal(filePaths.read('expected'), filePaths.read('actual'));
    test.done();
  },

  replaceDeepNestedFileWithRelativePath: testReplace('html/deep/nested'),

  returnUsefulObject: function (test) {
    var returnedObject = wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson
    });

    test.equal(typeof returnedObject.js, 'object');
    test.equal(typeof returnedObject.css, 'object');
    test.equal(typeof returnedObject.less, 'object');
    test.equal(typeof returnedObject.scss, 'object');
    test.equal(typeof returnedObject.packages, 'object');

    test.done();
  }
};
