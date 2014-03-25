# wiredep

Wire dependencies to your source code.


## Getting Started
Install the module with: `npm install --save wiredep`

```js
require('wiredep')({
  directory: 'the directory of your Bower packages.',
  bowerJson: 'your bower.json file contents.',
  src: ['filepaths', 'and/even/globs/*.html' 'to take', 'control of.'],

  // ----- Advanced Configuration -----
  // All of the below settings are for advanced configuration, to
  // give your project support for additional file types and more
  // control.
  //
  // Out of the box, wiredep will handle HTML files just fine for
  // JavaScript and CSS injection.

  dependencies: true,
  devDependencies: false,

  exclude: [ /jquery/, 'bower_components/modernizr/modernizr.js' ],

  ignorePath: 'optional path to ignore from the injected filepath.',

  fileTypes: {
    fileExtension: {
      block: /match the beginning-to-end of a bower block in this type of file/,
      detect: {
        typeOfBowerFile: /match the way this type of file is included/
      },
      replace: {
        typeOfBowerFile: '<format for this {{filePath}} to be injected>'
      }
    },

    // defaults:
    html: {
      block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi
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
To override a property, or lack of, in one of your dependency's `bower.json` file, you may specify an `overrides` object in your own `bower.json` .

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

## Programmatic Access
Require `wiredep` in your code and initialize `src` with an empty array. The results of the process will be available through `wiredep.config`.

```js
var wiredep = require('wiredep');
wiredep({ src: [], ... });

wiredep.config.get('global-dependencies-sorted').js;
// Returns an array with the file paths, in the order they need to be included.
// [ 'bower_components/jquery/dist/jquery.js',
//   'bower_components/jquery-ui/ui/jquery-ui.js',
//   ...
// ]

wiredep.config.get('global-dependencies').get();
// Returns an object with information about the dependencies and their resolutions.
// { 'jquery': {
//     main: [ 'bower_components/jquery/dist/jquery.js' ],
//     type: [ '.js' ],
//     name: 'jquery',
//     dependencies: {} },
//   'jquery-ui': {
//     main: [ 'bower_components/jquery-ui/ui/jquery-ui.js' ],
//     type: [ '.js' ],
//     name: 'jquery-ui',
//     dependencies: { jquery: '>=1.6' } },
//     ...
// }
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## License
Copyright (c) 2014 Stephen Sawchuk. Licensed under the MIT license.
