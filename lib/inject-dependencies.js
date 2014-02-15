/*
 * inject-dependencies.js
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var globalDependenciesSorted;
var ignorePath;
var fileTypes;

var fileTypesDefault = {
  html: {
    block: /(([\s\t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
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
    block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
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
    block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
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
    block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
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

  yaml: {
    block: /(([\s\t]*)#\s*bower:*(\S*))(\n|\r|.)*?(#\s*endbower)/gi,
    detect: {
      js: /-\s(.+)/gi,
      css: /-\s(.+)/gi
    },
    replace: {
      js: '- {{filePath}}',
      css: '- {{filePath}}'
    }
  }
};

fileTypesDefault.yml = fileTypesDefault.yaml;
fileTypesDefault.htm = fileTypesDefault.html;
fileTypesDefault['default'] = fileTypesDefault.html;

/**
 * Find references already on the page, not in a Bower block.
 */
var filesCaught = [];
var findReferences = function (match, reference) {
  filesCaught.push(reference);
  return match;
};


var replaceIncludes = function (fileType, returnType) {
  /**
   * Callback function after matching our regex from the source file.
   *
   * @param  {array}  match       strings that were matched
   * @param  {string} startBlock  the opening <!-- bower:xxx --> comment
   * @param  {string} spacing     the type and size of indentation
   * @param  {string} blockType   the type of block (js/css)
   * @param  {string} oldScripts  the old block of scripts we'll remove
   * @param  {string} endBlock    the closing <!-- endbower --> comment
   * @return {string} the new file contents
   */
  return function (match, startBlock, spacing, blockType, oldScripts, endBlock, offset, string) {
    blockType = blockType || 'js';

    var newFileContents = startBlock;
    var dependencies = globalDependenciesSorted[blockType] || [];

    string = string.substr(0, offset) + string.substr(offset + match.length);

    string.
      replace(oldScripts, '').
      replace(fileType.detect[blockType], findReferences);

    spacing = returnType + spacing.replace(/\r|\n/g, '');

    dependencies.
      map(function (path) {
        return path.replace(/\\/g, '/').replace(ignorePath, '');
      }).
      filter(function (path) {
        return filesCaught.indexOf(path) === -1;
      }).
      forEach(function (path) {
        newFileContents += spacing + fileType.replace[blockType].replace('{{filePath}}', path);
      });

    return newFileContents + spacing + endBlock;
  };
};


/**
 * Take a file path, read its contents, inject the Bower packages, then write
 * the new file to disk.
 *
 * @param  {string} file  path to the source file
 */
var injectScripts = function (file) {
  var contents = String(fs.readFileSync(file));
  var fileExt = path.extname(file).substr(1);
  var fileType = fileTypes[fileExt] || fileTypes['default'];
  var returnType = /\r\n/.test(contents) ? '\r\n' : '\n';

  fs.writeFileSync(file, contents.replace(
    fileType.block,
    replaceIncludes(fileType, returnType)
  ));
};


/**
 * Injects dependencies into the specified HTML file.
 *
 * @param  {object} config  the global configuration object.
 * @return {object} config
 */
module.exports = function inject(config) {
  globalDependenciesSorted = config.get('global-dependencies-sorted');
  ignorePath = config.get('ignore-path');
  fileTypes = _.clone(fileTypesDefault, true);

  _(config.get('file-types')).each(function (fileTypeConfig, fileType) {
    fileTypes[fileType] = fileTypes[fileType] || {};
    _.each(fileTypeConfig, function (config, configKey) {
      if (_.isPlainObject(fileTypes[fileType][configKey])) {
        fileTypes[fileType][configKey] =
          _.assign(fileTypes[fileType][configKey], config);
      } else {
        fileTypes[fileType][configKey] = config;
      }
    });
  });

  config.get('src').forEach(injectScripts);

  return config;
};
