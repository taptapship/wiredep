/*jshint latedef:false */
/*global after, describe, it, before, beforeEach */

'use strict';

var fs = require('fs-extra');
var path = require('path');
var assert = require('chai').assert;
var wiredep = require('../wiredep');

describe('wiredep', function () {
  fs.copySync('test/fixture', '.tmp');
  process.chdir('.tmp');
  after(function() {
    process.chdir('../');
    fs.remove.bind({}, '.tmp');
  });

  describe('replace functionality', function () {
    function testReplace(fileType) {
      return function () {
        var filePaths = getFilePaths('index', fileType);

        wiredep({ src: [filePaths.actual] });

        assert.deepEqual(
          filePaths.read('expected').split('\n'),
          filePaths.read('actual').split('\n')
        );
      };
    }

    it('should work with html files', testReplace('html'));
    it('should work with jade files (buffered comments)', testReplace('jade'));

    it('should work with jade files (unbuffered comments)', function () {
      var filePaths = getFilePaths('index-unbuffered-comments', 'jade');

      wiredep({ src: [filePaths.actual] });

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });

    it('should work with sass files', testReplace('sass'));
    it('should work with scss files', testReplace('scss'));
    it('should work with yml files', testReplace('yml'));
    it('should work with slim files', testReplace('slim'));
    it('should work with js files', testReplace('js'));
    it('should work with haml files', testReplace('haml'));
    it('should work with unrecognized file types', testReplace('unrecognized'));
    it('should correctly handle relative paths', testReplace('html/deep/nested'));

    it('should detect and use quotation marks', function () {
      var filePaths = getFilePaths('index-detect-quotation-marks', 'html');

      wiredep({ src: [filePaths.actual] });

      assert.equal(filePaths.read('expected'), filePaths.read('actual'));
    });

    it('should support globbing', function () {
      wiredep({ src: ['html/index-actual.*', 'jade/index-actual.*', 'slim/index-actual.*', 'haml/index-actual.*'] });

      [
        {
          actual: 'html/index-actual.html',
          expected: 'html/index-expected.html'
        },
        {
          actual: 'jade/index-actual.jade',
          expected: 'jade/index-expected.jade'
        },
        {
          actual: 'slim/index-actual.slim',
          expected: 'slim/index-expected.slim'
        },
        {
          actual: 'haml/index-actual.haml',
          expected: 'haml/index-expected.haml'
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
    it('should replace styl after second run', testReplaceSecondRun('styl'));
    it('should replace yml after second run', testReplaceSecondRun('yml'));
    it('should replace slim after second run', testReplaceSecondRun('slim'));
    it('should replace haml after second run', testReplaceSecondRun('haml'));
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
    it('should handle slim with excludes specified', testReplaceWithExcludedSrc('slim'));
    it('should handle haml with excludes specified', testReplaceWithExcludedSrc('haml'));
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
      it('should work with slim', testReplaceAfterUninstalledPackage('slim'));
      it('should work with haml', testReplaceAfterUninstalledPackage('haml'));
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
      it('should work with slim', testReplaceAfterUninstallingAllPackages('slim'));
      it('should work with haml', testReplaceAfterUninstallingAllPackages('haml'));
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

    it('should work with slim', testReplaceWithCustomFormat('slim', {
      slim: {
        replace: {
          js: 'script type=\'text/javascript\' src=\'{{filePath}}\'',
          css: 'link href=\'{{filePath}}\' rel=\'stylesheet\''
        }
      }
    }));

    it('should work with haml', testReplaceWithCustomFormat('haml', {
      haml: {
        replace: {
          js: '%script{type:\'text/javascript\', src:\'{{filePath}}\'}',
          css: '%link{href:\'{{filePath}}\', rel:\'stylesheet\'}'
        }
      }
    }));

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

  describe('events', function() {
    var filePath = 'html/index-emitter.html';
    var fileData;

    before(function(done) {
      fs.readFile(filePath, function(err, file) {
        fileData = file;
        done(err || null);
      });
    });

    beforeEach(function(done) {
      fs.writeFile(filePath, fileData, done);
    });

    it('should send injected file data', function(done) {
      var injected = 0;
      var paths = ['bootstrap.css', 'codecode.css', 'bootstrap.js', 'codecode.js', 'modernizr.js', 'jquery.js'];

      wiredep({
        src: filePath,
        onPathInjected: function(file) {
          assert(typeof file.block !== 'undefined');
          assert.equal(file.file, filePath);
          assert(paths.indexOf(file.path.split('/').pop()) > -1);

          if (++injected === paths.length) {
            done();
          }
        }
      });
    });

    it('should send updated file path', function(done) {
      wiredep({
        src: filePath,
        onFileUpdated: function(path) {
          assert.equal(path, filePath);
          done();
        }
      });
    });

    it('should send package name when main is not found', function(done) {
      var bowerJson = JSON.parse(fs.readFileSync('./bower_packages_without_main.json'));
      var packageWithoutMain = 'fake-package-without-main-and-confusing-file-tree';

      wiredep({
        bowerJson: bowerJson,
        src: filePath,
        onMainNotFound: function(pkg) {
          assert.equal(pkg, packageWithoutMain);
          done();
        }
      });
    });

    it('should throw an error when component is not found', function() {
      var bowerJson = JSON.parse(fs.readFileSync('./bower_with_missing_component.json'));
      var missingComponent = 'missing-component';

      assert.throws(function () {
        wiredep({
          bowerJson: bowerJson,
          src: filePath
        });
      }, missingComponent + ' is not installed. Try running `bower install` or remove the component from your bower.json file.');
    });

    it('should allow overriding the error when component is not found', function(done) {
      var bowerJson = JSON.parse(fs.readFileSync('./bower_with_missing_component.json'));
      var missingComponent = 'missing-component';

      wiredep({
        bowerJson: bowerJson,
        src: filePath,
        onError: function(err) {
          assert.ok(err instanceof Error);
          assert.equal(err.message, missingComponent + ' is not installed. Try running `bower install` or remove the component from your bower.json file.');
          done();
        }
      });
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
    assert.equal(typeof returnedObject.styl, 'object');
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

  it('should support inclusion of glob main files from bower.json', function () {
    var filePaths = getFilePaths('index-include-glob', 'html');

    wiredep({
      bowerJson: JSON.parse(fs.readFileSync('./glob_main/bower.json')),
      src: [filePaths.actual],
      cwd: 'glob_main'
    });

    assert.equal(filePaths.read('actual'), filePaths.read('expected'));
  });

  it('include-self: true should support inclusion of glob main files from own bower.json', function () {
    var filePaths = getFilePaths('index-include-self-glob', 'html');

    wiredep({
      bowerJson: JSON.parse(fs.readFileSync('./bower_with_main_glob.json')),
      src: [filePaths.actual],
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
