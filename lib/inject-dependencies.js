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
  script: /<script.*src=['"](.+)['"]>/gi
};


/**
 * Store references to scripts found outside of Bower blocks.
 */
var scriptsCaught = [];


/**
 * Find scripts already on the page, not in a Bower block.
 */
var findScripts = function (match, script) {
  scriptsCaught.push(script);
  return match;
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
  var html = startBlock;
  var dependencies = globalDependenciesSorted[blockType || 'js'] || [];

  string = string.substr(0, offset) + string.substr(offset + match.length);

  string.
    replace(oldScripts, '').
    replace(regex.script, findScripts);

  spacing = '\n' + spacing.replace(/\r|\n/g, '');

  if (dependencies.length) {
    globalDependenciesSorted[blockType || 'js'].
      map(function (path) {
        return path.replace(ignorePath, '');
      }).
      filter(function (path) {
        return scriptsCaught.indexOf(path) === -1;
      }).
      forEach(function (path) {
        html += spacing + '<script src="' + path + '"></script>';
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
