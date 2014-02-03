# wiredep

Wire dependencies to your source code.


## Getting Started
Install the module with: `npm install wiredep --save`

```js
require('wiredep')({
  directory: 'the directory of your Bower packages.',
  bowerJson: 'your bower.json file contents.',
  src: ['filepaths', 'to take', 'control of.'],

  // ----- Advanced Configuration -----
  // All of the below settings are for advanced configuration, to
  // give your project support for additional file types and more
  // control.
  //
  // Out of the box, wiredep will handle HTML files just fine for
  // JavaScript and CSS injection.

  exclude: [ /jquery/, "bower_components/modernizr/modernizr.js" ],

  ignorePath: 'optional path to ignore from the injected filepath.',

  devMode: true, // process the devDependencies of your bower.json instead of
   the dependencies.  (default false)

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
      block: /(([\s\t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi
      detect: {
        js: /<script.*src=['"](.+)['"]>/gi,
        css: /<link.*href=['"](.+)['"]/gi
      },
      replace: {
        js: '<script src="{{filePath}}"></script>',
        css: '<link rel="stylesheet" href="{{filePath}}" />'
      }
    },
    yml: {
      block: /(([\s\t]*)#\s*bower:*(\S*)\s*)(\n|\r|.)*?(#\s*endbower\s*)/gi,
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


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## License
Copyright (c) 2013 Stephen Sawchuk. Licensed under the MIT license.
