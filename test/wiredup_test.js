/*jshint latedef:false */
/*global after, describe, it */

'use strict';

var fs = require('fs-extra');
var path = require('path');
var assert = require('assert');
var wiredep = require('../wiredep');

describe('wiredep', function () {
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

    it('should work with html files', testReplace('html'));
    it('should work with jade files', testReplace('jade'));
    it('should work with sass files', testReplace('sass'));
    it('should work with scss files', testReplace('scss'));
    it('should work with yml files', testReplace('yml'));
    it('should work with unrecognized file types', testReplace('unrecognized'));
    it('should correctly handle relative paths', testReplace('html/deep/nested'));

    it('should support globbing', function () {
      wiredep({ src: ['html/index-actual.*', 'jade/index-actual.*'] });

      [
        {
          actual: 'html/index-actual.html',
          expected: 'html/index-expected.html'
        },
        {
          actual: 'jade/index-actual.jade',
          expected: 'jade/index-expected.jade'
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
    function testReplaceSecondRun(fileType) {
      return function () {
        var filePaths = getFilePaths('index-second-run', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should replace html after second run', testReplaceSecondRun('html'));
    it('should replace jade after second run', testReplaceSecondRun('jade'));
    it('should replace less after second run', testReplaceSecondRun('less'));
    it('should replace sass after second run', testReplaceSecondRun('sass'));
    it('should replace scss after second run', testReplaceSecondRun('scss'));
    it('should replace yml after second run', testReplaceSecondRun('yml'));
  });

  describe('excludes', function () {
    function testReplaceWithExcludedSrc(fileType) {
      return function () {
        var filePaths = getFilePaths('index-excluded-files', fileType);

        wiredep({
          src: [filePaths.actual],
          exclude: ['bower_components/bootstrap/dist/js/bootstrap.js', /codecode/]
        });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should handle html with excludes specified', testReplaceWithExcludedSrc('html'));
    it('should handle jade with excludes specified', testReplaceWithExcludedSrc('jade'));
    it('should handle yml with excludes specified', testReplaceWithExcludedSrc('yml'));
  });

  describe('after uninstalls', function () {
    describe('after uninstalling one package', function () {
      function testReplaceAfterUninstalledPackage(fileType) {
        return function () {
          var filePaths = getFilePaths('index-after-uninstall', fileType);

          wiredep({ src: [filePaths.actual] });

          wiredep({
            bowerJson: JSON.parse(fs.readFileSync('./bower_after_uninstall.json')),
            src: [filePaths.actual]
          });

          assert.equal(filePaths.read('expected'), filePaths.read('actual'));
        };
      }

      it('should work with html', testReplaceAfterUninstalledPackage('html'));
      it('should work with jade', testReplaceAfterUninstalledPackage('jade'));
    });

    describe('after uninstalling all packages', function () {
      function testReplaceAfterUninstallingAllPackages(fileType) {
        return function () {
          var filePaths = getFilePaths('index-after-uninstall-all', fileType);

          wiredep({ src: [filePaths.actual] });

          wiredep({
            bowerJson: JSON.parse(fs.readFileSync('./bower_after_uninstall_all.json')),
            src: [filePaths.actual]
          });

          assert.equal(filePaths.read('expected'), filePaths.read('actual'));
        };
      }

      it('should work with html', testReplaceAfterUninstallingAllPackages('html'));
      it('should work with jade', testReplaceAfterUninstallingAllPackages('jade'));
    });
  });

  describe('custom format', function () {
    function testReplaceWithCustomFormat(fileType, fileTypes) {
      return function () {
        var filePaths = getFilePaths('index-custom-format', fileType);

        wiredep({
          src: [filePaths.actual],
          fileTypes: fileTypes
        });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should work with html', testReplaceWithCustomFormat('html', {
      html: {
        replace: {
          js: '<script type="text/javascript" src="{{filePath}}"></script>',
          css: '<link href="{{filePath}}" rel="stylesheet">'
        }
      }
    }));

    it('should work with jade', testReplaceWithCustomFormat('jade', {
      jade: {
        replace: {
          js: 'script(type=\'text/javascript\', src=\'{{filePath}}\')',
          css: 'link(href=\'{{filePath}}\', rel=\'stylesheet\')'
        }
      }
    }));

    it('should work with yml', testReplaceWithCustomFormat('yml', {
      yml: {
        replace: {
          css: '- "{{filePath}}" #css',
          js: '- "{{filePath}}"'
        }
      }
    }));
  });

  describe('support to multiple dot extension filenames', function () {
    function testReplaceWithMultipleDotExt(fileTypes, fileName, bowerJsonFile) {
      return function () {
        var filePaths = getFilePaths(fileName, 'html');

        wiredep({
          bowerJson: JSON.parse(fs.readFileSync(bowerJsonFile || './bower.json')),
          src: [filePaths.actual],
          fileTypes: fileTypes
        });

        assert.equal(filePaths.read('expected'), filePaths.read('actual'));
      };
    }

    it('should support extensions using multiple dots', testReplaceWithMultipleDotExt({
      html: {
        detect: {
          js: /<script.*src=['"]([^'"]+)/gi,
          css: /<link.*href=['"]([^'"]+)/gi,
          'notmin.css': /<link.*href=['"]([^'"]+)/gi
        },
        replace: {
          js: '<script type="text/javascript" src="{{filePath}}"></script>',
          css: '<link href="{{filePath}}" rel="stylesheet">',
          'notmin.css': '<link href="{{filePath}}" rel="stylesheet">'
        }
      }
    }, 'index-with-multiple-dot-extensions', './bower_packages_with_multiple_dot_ext.json'));

    it('should ignore multiple dot extensions if no extra detect/replace pattern was provided', testReplaceWithMultipleDotExt({
      html: {
        replace: {
          js: '<script type="text/javascript" src="{{filePath}}"></script>',
          css: '<link href="{{filePath}}" rel="stylesheet">'
        }
      }
    }, 'index-without-multiple-dot-extensions', './bower_packages_with_multiple_dot_ext.json'));
  });

  describe('devDependencies', function () {
    it('should wire devDependencies if specified', function () {
      var filePaths = getFilePaths('index-with-dev-dependencies', 'html');

      wiredep({
        dependencies: false,
        devDependencies: true,
        src: [filePaths.actual]
      });

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });
  });

  describe('overrides', function () {
    it('should not display a warning if a no-`main` package is excluded', function () {
      var filePaths = getFilePaths('index-packages-without-main', 'html');

      wiredep({
        bowerJson: JSON.parse(fs.readFileSync('./bower_packages_without_main.json')),
        src: [filePaths.actual],
        exclude: ['fake-package-without-main-and-confusing-file-tree']
      });

      // If a package is excluded, don't display a warning.
      assert.equal(wiredep.config.get('warnings').length, 0);

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });

    it('should allow configuration overrides to specify a `main`', function () {
      var filePaths = getFilePaths('index-packages-without-main', 'html');
      var bowerJson = JSON.parse(fs.readFileSync('./bower_packages_without_main.json'));
      var overrides = bowerJson.overrides;
      delete bowerJson.overrides;

      wiredep({
        bowerJson: bowerJson,
        overrides: overrides,
        src: [filePaths.actual],
        exclude: ['fake-package-without-main-and-confusing-file-tree']
      });

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });

    it('should allow configuration overrides to specify `dependencies`', function () {
      var filePaths = getFilePaths('index-override-dependencies', 'html');
      var bowerJson = JSON.parse(fs.readFileSync('./bower_packages_without_dependencies.json'));
      var overrides = bowerJson.overrides;
      delete bowerJson.overrides;

      wiredep({
        bowerJson: bowerJson,
        overrides: overrides,
        src: [filePaths.actual]
      });

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });
  });

  it('should allow specifying a custom replace function', function () {
    var filePaths = getFilePaths('index-with-custom-replace-function', 'html');

    wiredep({
      src: [filePaths.actual],
      fileTypes: {
        html: {
          replace: {
            js: function (filePath) {
              return '<script src="' + filePath + '" class="yay"></script>';
            }
          }
        }
      }
    });

    assert.equal(filePaths.read('expected'), filePaths.read('actual'));
  });

  it('should return a useful object', function () {
    var returnedObject = wiredep();

    assert.equal(typeof returnedObject.js, 'object');
    assert.equal(typeof returnedObject.css, 'object');
    assert.equal(typeof returnedObject.less, 'object');
    assert.equal(typeof returnedObject.scss, 'object');
    assert.equal(typeof returnedObject.packages, 'object');
  });

  it('should respect the directory specified in a `.bowerrc`', function () {
    var filePaths = getFilePaths('index-with-custom-bower-directory', 'html');

    wiredep({
      bowerJson: JSON.parse(fs.readFileSync('./bowerrc/bower.json')),
      cwd: './bowerrc',
      src: [filePaths.actual]
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
  });

  it('should support inclusion of main files from top-level bower.json', function () {
    var filePaths = getFilePaths('index-include-self', 'html');

    wiredep({
      bowerJson: JSON.parse(fs.readFileSync('./bower_with_main.json')),
      src: [filePaths.actual],
      includeSelf: true
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
  });

  it('should support inclusion of main files from bower.json in some other dir', function () {
    var filePaths = getFilePaths('index-cwd-include-self', 'html');

    wiredep({
      src: [filePaths.actual],
      cwd: 'cwd_includeself',
      includeSelf: true
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
  });

  it('should support inclusion of main files from some other dir with manually loaded bower.json', function () {
    var filePaths = getFilePaths('index-cwd-include-self', 'html');

    wiredep({
      bowerJson: JSON.parse(fs.readFileSync('./cwd_includeself/bower.json')),
      src: [filePaths.actual],
      cwd: 'cwd_includeself',
      includeSelf: true
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
