'use strict';

var $ = {
  chalk: require('chalk'),
  fs: require('fs'),
  path: require('path')
};

var fileTypes;
var filesCaught = [];
var generatedStrings;
var generatedObjects;

/**
 * Inject dependencies into the specified source file.
 *
 * @param  {object} config  the global configuration object.
 * @return {object} config
 */
function injectDependencies(config) {
  var stream = config.get('stream');

  filesCaught = [];
  generatedStrings = config.get('generatedStrings');
  generatedObjects = config.get('generatedObjects');
  fileTypes = config.get('file-types');

  // if (stream.src) {
  //   config.set('stream', {
  //     src: injectScriptsStream(stream.path, stream.src, stream.fileType),
  //     fileType: stream.fileType
  //   });
  // } else {
    config.get('src').forEach(injectScripts);
  // }

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
    var property = null,
        splitedValues,
        newContent;

    if (blockType.indexOf(':') !== -1) {
      splitedValues = blockType.split(':');
      blockType = splitedValues[0];
      property = splitedValues[1];
    } else {
      blockType = blockType || 'default';
    }

    var newFileContents = startBlock;

    (string.substr(0, offset) + string.substr(offset + match.length)).
      replace(oldScripts, '').
      replace(fileType.block, '');

    spacing = returnType + spacing.replace(/\r|\n/g, '');

    if (property) {
      newContent = JSON.stringify(generatedObjects[blockType][property], null, "  ");
    } else {
      newContent = generatedStrings[blockType];
    }

    newFileContents += spacing + newContent.replace(/\n/g, spacing);

    return newFileContents + spacing + endBlock;
  };
}


/**
 * Take a file path, read its contents, inject the require config, then write
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
