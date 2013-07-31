/*
 * detect-dependencies.js
 * https://github.com/stephenplusplus/wiredep
 *
 * Copyright (c) 2013 Stephen Sawchuk
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');


/**
 * Find the component's JSON configuration file.
 *
 * @param  {object} config     the global configuration object
 * @param  {string} component  the name of the component to dig for
 * @return {object} the component's config file
 */
var findComponentConfigFile = function (config, component) {
  var componentConfigFile;

  _.each(['.bower.json', 'bower.json', 'component.json', 'package.json'], function (configFile) {
    configFile = path.join(config.get('directory'), component, configFile);

    if (!_.isObject(componentConfigFile) && fs.existsSync(configFile)) {
      componentConfigFile = JSON.parse(fs.readFileSync(configFile));
    }
  });

  return componentConfigFile;
};

/**
 * Find the main file the component refers to. It's not always main :(
 *
 * @param  {object} config        the global configuration object
 * @param  {string} component     the name of the component to dig for
 * @param  {componentConfigFile}  the component's config file
 * @return {string} the path to the component's primary file
 */
var findMainFile = function (config, component, componentConfigFile) {
  var filePath;

  if (_.isString(componentConfigFile.main)) {
    // start by looking for what every component should have: config.main
    filePath = componentConfigFile.main;
  } else if (_.isArray(componentConfigFile.main)) {
    // in case config.main is an array, grab the first one (grab all instead?)
    filePath = componentConfigFile.main[0];
  } else if (_.isArray(componentConfigFile.scripts)) {
    // still haven't found it. is it stored in config.scripts, then?
    filePath = componentConfigFile.scripts[0];
  }

  if (_.isString(filePath)) {
    filePath = path.join(config.get('directory'), component, filePath);
  }

  return filePath;
};


/**
 * Store the information our prioritizer will need to determine rank.
 *
 * @param  {object} config   the global configuration object
 * @param  {object} options  optional parameters
 * @return {function} the iterator function, called on every component
 */
var gatherInfo = function (config, options) {
  /**
   * The iterator function, which is called on each component.
   *
   * @param  {string} version    the version of the component
   * @param  {string} component  the name of the component
   * @return {undefined}
   */
  return function (version, component) {
    var dep = config.get('global-dependencies').get(component) || {
      type: '',
      main: '',
      dependencies: {},
    };

    var componentConfigFile = findComponentConfigFile(config, component);

    if (_.isNumber(dep.dependents)) {
      dep.dependents += 1;
    } else {
      dep.dependents = 1;
    }

    dep.main = findMainFile(config, component, componentConfigFile);
    dep.type = path.extname(dep.main);

    if (!_.isString(dep.main)) {
      // can't find the main file. this config file is useless!
      var warnings = config.get('warnings');

      warnings.push(component + ' was not injected in your HTML.');
      warnings.push(
        'Please go take a look in "'
        + path.join(config.get('directory'), component)
        + '" for the file you need, then manually include it in your HTML file.');

      config.set('warnings', warnings);
      return;
    }

    if (options.nestedDependencies && componentConfigFile.dependencies) {
      var gatherInfoAgain = gatherInfo(config, { nestedDependencies: false });

      dep.dependencies = componentConfigFile.dependencies;

      _.each(componentConfigFile.dependencies, function (version, component) {
        gatherInfoAgain(version, component);
      });
    }

    config.get('global-dependencies').set(component, dep);
  };
};


/**
 * Sort the dependencies in the order we can best determine they're needed.
 *
 * @param  {object} config    the global configuration object
 * @param  {string} fileType  the type of file to prioritize
 * @return {array} the sorted items of 'path/to/main/files.ext' sorted by type
 */
var prioritizeDependencies = function (config, fileType) {
  var globalDependencies = config.get('global-dependencies').get();
  var grouped = _.chain(globalDependencies).filter(function (dep) {
    return dep.type === fileType;
  }).groupBy('dependents').value();

  var sorted = [];
  _.each(grouped, function (dependencies) {
    _.chain(dependencies).groupBy(function (dependency) {
      return _.size(dependency.dependencies);
    }).toArray().value().reverse().forEach(function (dependency) {
      _.each(dependency, function (dependency) {
        sorted.push(dependency.main);
      });
    });
  });
  return sorted.reverse();
};


/**
 * Detect dependencies of the components from `bower.json`.
 *
 * @param  {object} config the global configuration object.
 * @return {object} config
 */
module.exports = function detect(config) {
  _.each(config.get('bower.json').dependencies, gatherInfo(config,
    { nestedDependencies: true }));

  config.set('global-dependencies-sorted', {
    js: prioritizeDependencies(config, '.js'),
    css: prioritizeDependencies(config, '.css'),
    scss: prioritizeDependencies(config, '.scss')
  });

  return config;
};
