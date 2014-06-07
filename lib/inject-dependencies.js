'use strict';

var $ = require('modmod')('chalk', 'fs', 'path');

var fileTypes;
var filesCaught = [];
var globalDependenciesSorted;
var ignorePath;


/**
 * Inject dependencies into the specified source file.
 *
 * @param  {object} config  the global configuration object.
 * @return {object} config
 */
function injectDependencies(config) {
  var stream = config.get('stream');

  filesCaught = [];
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
}


function replaceIncludes(file, fileType, returnType) {
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

    (string.substr(0, offset) + string.substr(offset + match.length)).
      replace(oldScripts, '').
      replace(fileType.block, '').
      replace(fileType.detect[blockType], function (match, reference) {
        filesCaught.push(reference.replace(/['"\s]/g, ''));
        return match;
      });

    spacing = returnType + spacing.replace(/\r|\n/g, '');

    dependencies.
      map(function (filePath) {
        return $.path.join(
          $.path.relative($.path.dirname(file), $.path.dirname(filePath)),
          $.path.basename(filePath)
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
}


/**
 * Take a file path, read its contents, inject the Bower packages, then write
 * the new file to disk.
 *
 * @param  {string} filePath  path to the source file
 */
function injectScripts(filePath) {
  var contents = String($.fs.readFileSync(filePath));
  var fileExt = $.path.extname(filePath).substr(1);
  var fileType = fileTypes[fileExt] || fileTypes['default'];
  var returnType = /\r\n/.test(contents) ? '\r\n' : '\n';

  var newContents = contents.replace(
    fileType.block,
    replaceIncludes(filePath, fileType, returnType)
  );

  if (contents !== newContents) {
    $.fs.writeFileSync(filePath, newContents);

    if (process.env.NODE_ENV !== 'test') {
      console.log($.chalk.cyan(filePath) + ' modified.');
    }
  }
}


function injectScriptsStream(filePath, contents, fileExt) {
  var returnType = /\r\n/.test(contents) ? '\r\n' : '\n';
  var fileType = fileTypes[fileExt] || fileTypes['default'];

  return contents.replace(
    fileType.block,
    replaceIncludes(filePath, fileType, returnType)
  );
}


module.exports = injectDependencies;
