/*
 * inject-dependencies.js
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');

var globalDependenciesSorted;
var ignorePath;

var regex = {
  bower: /(([\s\t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
  script: /<script.*src=['"](.+)['"]>/gi,
  stylesheet: /<link.*href=['"](.+)['"]/gi
};


/**
 * Store references to files found outside of Bower blocks.
 */
var filesCaught = [];


/**
 * Find scripts already on the page, not in a Bower block.
 */
var findScripts = function (match, script) {
  filesCaught.push(script);
  return match;
};


/**
 * Find scripts already on the page, not in a Bower block.
 */
var findStyleSheets = function (match, stylesheet) {
  filesCaught.push(stylesheet);
  return match;
};


/**
 * Replace script and stylesheet include blocks given a path.
 *
 * @param  {string} blockType  the type of block (css/js)
 * @param  {string} spacing    the spacing used to indent the block
 * @return {string} the new file include
 */
var replace = function (blockType, spacing, path) {
  var replacePattern = {
    css: function (path) {
      return '<link rel="stylesheet" href="' + path + '" />';
    },
    js: function (path) {
      return '<script src="' + path + '"></script>';
    }
  }[blockType];

  return spacing + replacePattern(path);
};


/**
 * Callback function after matching our regex from the HTML file.
 *
 * @param  {array}  match       strings that were matched
 * @param  {string} startBlock  the opening <!-- bower:xxx --> comment
 * @param  {string} spacing     the type and size of indentation
 * @param  {string} blockType   the type of block (js/css)
 * @param  {string} oldScripts  the old block of scripts we'll remove
 * @param  {string} endBlock    the closing <!-- endbower --> comment
 * @return {string} the new html
 */
var injectScripts = function (match, startBlock, spacing, blockType, oldScripts, endBlock, offset, string) {
  blockType = blockType || 'js';

  var html = startBlock;
  var dependencies = globalDependenciesSorted[blockType] || [];

  string = string.substr(0, offset) + string.substr(offset + match.length);

  string.
    replace(oldScripts, '').
    replace(regex.script, findScripts).
    replace(regex.stylesheet, findStyleSheets);

  spacing = '\n' + spacing.replace(/\r|\n/g, '');

  if (dependencies.length) {
    dependencies.
      map(function (path) {
        return path.replace(/\\/g, '/').replace(ignorePath, '');
      }).
      filter(function (path) {
        return filesCaught.indexOf(path) === -1;
      }).
      forEach(function (path) {
        html += replace(blockType, spacing, path);
      });

    return html += spacing + endBlock;
  } else {
    return match;
  }
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

  var htmlFile = config.get('html-file');
  var html = config.get('html');

  // grab the html file and its contents, then drop our scripts in.
  fs.writeFileSync(htmlFile, html.replace(regex.bower, injectScripts));

  return config;
};
