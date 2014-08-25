'use strict';


var helpers = require('../helpers');

function logWarnings(config) {
  if (config.get('warnings')) {
    helpers.warn(config.get('warnings'));
  }
}

module.exports = logWarnings;
