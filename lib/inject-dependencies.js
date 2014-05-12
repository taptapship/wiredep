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
var chalk = require('chalk');

var globalDependenciesSorted;
var ignorePath;
var fileTypes;


/**
 * Find references already on the page, not in a Bower block.
 */
var filesCaught = [];
var findReferences = function (match, reference) {
  filesCaught.push(reference);
  return match;
};


var replaceIncludes = function (file, fileType, returnType) {
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
      map(function (filePath) {
        return path.join(
          path.relative(path.dirname(file), path.dirname(filePath)),
          path.basename(filePath)
        ).replace(/\\/g, '/').replace(ignorePath, '');
      }).
      filter(function (filePath) {
        return filesCaught.indexOf(filePath) === -1;
      }).
      forEach(function (filePath) {
        if (typeof fileType.replace[blockType] === 'function') {
          newFileContents += spacing + fileType.replace[blockType](filePath);
        } else if (typeof fileType.replace[blockType] === 'string') {
          newFileContents += spacing + fileType.replace[blockType].replace('{{filePath}}', filePath);
        }        
      });

    return newFileContents + spacing + endBlock;
  };
};


/**
 * Take a file path, read its contents, inject the Bower packages, then write
 * the new file to disk.
 *
 * @param  {string} filePath  path to the source file
 */
var injectScripts = function (filePath) {
  var contents = String(fs.readFileSync(filePath));
  var fileExt = path.extname(filePath).substr(1);
  var fileType = fileTypes[fileExt] || fileTypes['default'];
  var returnType = /\r\n/.test(contents) ? '\r\n' : '\n';

  var newContents = contents.replace(
    fileType.block,
    replaceIncludes(filePath, fileType, returnType)
  );

  if (contents !== newContents) {
    fs.writeFileSync(filePath, newContents);

    console.log(chalk.cyan(filePath) + ' modified.');
  }
};


var injectScriptsStream = function (filePath, contents, fileExt) {
  var returnType = /\r\n/.test(contents) ? '\r\n' : '\n';
  var fileType = fileTypes[fileExt] || fileTypes['default'];

  return contents.replace(
    fileType.block,
    replaceIncludes(filePath, fileType, returnType)
  );
};


/**
 * Injects dependencies into the specified HTML file.
 *
 * @param  {object} config  the global configuration object.
 * @return {object} config
 */
module.exports = function inject(config) {
  var stream = config.get('stream');

  globalDependenciesSorted = config.get('global-dependencies-sorted');
  ignorePath = config.get('ignore-path');
  fileTypes = config.get('file-types');

  if (stream.src) {
    config.set('stream', {
      src: injectScriptsStream(stream.path, stream.src, stream.fileType),
      fileType: stream.fileType
    });
  } else {
    config.get('src').forEach(injectScripts);
  }

  return config;
};
