'use strict';

var $ = require('modmod')('lodash');
var _ = $.lodash;

var fileTypesDefault = require('./default-file-types');


function mergeFileTypesWithDefaults(optsFileTypes) {
  var fileTypes = _.clone(fileTypesDefault, true);

  _(optsFileTypes).each(function (fileTypeConfig, fileType) {
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

  return fileTypes;
}

module.exports = mergeFileTypesWithDefaults;
