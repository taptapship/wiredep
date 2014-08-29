'use strict';

var $ = {
  _: require('lodash')
};


function setDetectableFileTypes(config) {
  $._.pluck(config.get('file-types'), 'detect').
    forEach(function (fileType) {
      Object.keys(fileType).
        forEach(function (detectableFileType) {
          var detectableFileTypes = config.get('detectable-file-types');

          if (detectableFileTypes.indexOf(detectableFileType) === -1) {
            config.set('detectable-file-types', detectableFileTypes.concat(detectableFileType));
          }
        });
    });
}


module.exports = setDetectableFileTypes;
