# wiredep
> Wire dependencies to your source code.


## Getting Started
Install the module with [npm](https://npmjs.org):

```bash
$ npm install --save wiredep
```

Install your [bower](http://bower.io) dependencies (if you haven't already):

```bash
$ bower install --save jquery
```

Insert placeholders in your code where your dependencies will be injected:

```html
<html>
<head>
  <!-- bower:css -->
  <!-- endbower -->
</head>
<body>
  <!-- bower:js -->
  <!-- endbower -->
</body>
</html>
```

Let `wiredep` work its magic:

```bash
$ node
> require('wiredep')({ src: 'index.html' });

index.html modified.
{ packages:
   { jquery:
      { main: [Object],
        type: [Object],
        name: 'jquery',
        dependencies: {} } },
  js: [ 'bower_components/jquery/dist/jquery.js' ] }
```


```html
<html>
<head>
  <!-- bower:css -->
  <!-- endbower -->
</head>
<body>
  <!-- bower:js -->
  <script src="bower_components/jquery/dist/jquery.js"></script>
  <!-- endbower -->
</body>
</html>
```


## Build Chain Integration

### [gulp.js](http://gulpjs.com/)

wiredep works with [streams](https://github.com/substack/stream-handbook) and integrates with gulp.js out of the box:

```js
var wiredep = require('wiredep').stream;

gulp.task('bower', function () {
  gulp.src('./src/footer.html')
    .pipe(wiredep({
      optional: 'configuration',
      goes: 'here'
    }))
    .pipe(gulp.dest('./dest'));
});
```

### [Grunt](http://gruntjs.com)

See [`grunt-wiredep`](https://github.com/stephenplusplus/grunt-wiredep).


## Programmatic Access
You can run `wiredep` without manipulating any files.

```js
require('wiredep')();
```

...returns...
```js
{
  js: [
    'paths/to/your/js/files.js',
    'in/their/order/of/dependency.js'
  ],
  css: [
    'paths/to/your/css/files.css'
  ],
  // etc.
}
```


## Command Line
Install wiredep globally to wire up Bower packages from the terminal.

```sh
$ npm install -g wiredep
$ wiredep
Wire Bower dependencies to your source code.

Usage: $ wiredep [options]

Options:
  -h, --help          # Print usage information
  -v, --version       # Print the version
  -b, --bowerJson     # Path to `bower.json`
  -d, --directory     # Your Bower directory
  -e, --exclude       # A path to be excluded
  -i, --ignorePath    # A path to be ignored
  -s, --src           # Path to your source file
  --dependencies      # Include Bower `dependencies`
  --devDependencies   # Include Bower `devDependencies`
  --includeMains      # Include top-level bower.json `main` files
  --mainFileDirectory # Specify a path to top-level `main` files
  --verbose           # Print the results of `wiredep`
```

### Bower Hooks
You may also take advantage of Bower >=1.3.1's [hooks](https://github.com/bower/bower/blob/master/HOOKS.md), with a `.bowerrc` such as:

```json
{
  "scripts": {
    "postinstall": "wiredep -s path/to/src.html"
  }
}
```


## Configuration

```js
require('wiredep')({
  directory: 'the directory of your Bower packages.', // default: '.bowerrc'.directory || bower_components
  bowerJson: 'your bower.json file contents.',        // default: require('./bower.json')
  src: ['filepaths', 'and/even/globs/*.html' 'to take', 'control of.'],

  // ----- Advanced Configuration -----
  // All of the below settings are for advanced configuration, to
  // give your project support for additional file types and more
  // control.
  //
  // Out of the box, wiredep will handle HTML files just fine for
  // JavaScript and CSS injection.

  cwd: 'path/to/where/we/are/pretending/to/be',

  dependencies: true,    // default: true
  devDependencies: true, // default: false
  includeMains: true,    // default: false
  mainFileDirectory: 'path/to/your/main/files', // default: cwd || './'

  exclude: [ /jquery/, 'bower_components/modernizr/modernizr.js' ],

  ignorePath: /string or regexp to ignore from the injected filepath/,

  overrides: {
    // see `Bower Overrides` section below.
    //
    // This inline object offers another way to define your overrides if
    // modifying your project's `bower.json` isn't an option.
  },

  fileTypes: {
    fileExtension: {
      block: /match the beginning-to-end of a bower block in this type of file/,
      detect: {
        typeOfBowerFile: /match the way this type of file is included/
      },
      replace: {
        typeOfBowerFile: '<format for this {{filePath}} to be injected>',
        anotherTypeOfBowerFile: function (filePath) {
          return '<script class="random-' + Math.random() + '" src="' + filePath + '"></script>';
        }
      }
    },

    // defaults:
    html: {
      block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
      detect: {
        js: /<script.*src=['"](.+)['"]>/gi,
        css: /<link.*href=['"](.+)['"]/gi
      },
      replace: {
        js: '<script src="{{filePath}}"></script>',
        css: '<link rel="stylesheet" href="{{filePath}}" />'
      }
    },

    jade: {
      block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
      detect: {
        js: /script\(.*src=['"](.+)['"]>/gi,
        css: /link\(href=['"](.+)['"]/gi
      },
      replace: {
        js: 'script(src=\'{{filePath}}\')',
        css: 'link(rel=\'stylesheet\', href=\'{{filePath}}\')'
      }
    },

    less: {
      block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
      detect: {
        css: /@import\s['"](.+)['"]/gi,
        less: /@import\s['"](.+)['"]/gi
      },
      replace: {
        css: '@import "{{filePath}}";',
        less: '@import "{{filePath}}";'
      }
    },

    sass: {
      block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
      detect: {
        css: /@import\s['"](.+)['"]/gi,
        sass: /@import\s['"](.+)['"]/gi,
        scss: /@import\s['"](.+)['"]/gi
      },
      replace: {
        css: '@import {{filePath}}',
        sass: '@import {{filePath}}',
        scss: '@import {{filePath}}'
      }
    },

    scss: {
      block: /(([ \t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
      detect: {
        css: /@import\s['"](.+)['"]/gi,
        sass: /@import\s['"](.+)['"]/gi,
        scss: /@import\s['"](.+)['"]/gi
      },
      replace: {
        css: '@import "{{filePath}}";',
        sass: '@import "{{filePath}}";',
        scss: '@import "{{filePath}}";'
      }
    },

    yml: {
      block: /(([ \t]*)#\s*bower:*(\S*)\s*)(\n|\r|.)*?(#\s*endbower\s*)/gi,
      detect: {
        js: /-\s(.+)/gi,
        css: /-\s(.+)/gi
      },
      replace: {
        js: '- {{filePath}}'
        css: '- {{filePath}}'
      }
    }
  }
});
```


## Bower Overrides
To override a property, or lack of, in one of your dependency's `bower.json` file, you may specify an `overrides` object in your own `bower.json`.

As an example, this is what your `bower.json` may look like if you wanted to override `package-without-main`'s `main` file:

```js
{
  ...
  "dependencies": {
    "package-without-main": "1.0.0"
  },
  "overrides": {
    "package-without-main": {
      "main": "dist/package-without-main.js"
    }
  }
}
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm test`.


## License
Copyright (c) 2014 Stephen Sawchuk. Licensed under the MIT license.
