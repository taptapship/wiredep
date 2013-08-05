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

  ['.bower.json',
    'bower.json',
    'component.json',
    'package.json'].forEach(function (configFile) {
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
 * @return {function} the iterator function, called on every component
 */
var gatherInfo = function (config) {
  /**
   * The iterator function, which is called on each component.
   *
   * @param  {string} version    the version of the component
   * @param  {string} component  the name of the component
   * @return {undefined}
   */
  return function (version, component) {
    var dep = config.get('global-dependencies').get(component) || {
      main: '',
      type: '',
      name: '',
      dependents: 0,
      dependencies: {}
    };

    var componentConfigFile = findComponentConfigFile(config, component);

    dep.main = findMainFile(config, component, componentConfigFile);
    dep.type = path.extname(dep.main);
    dep.name = componentConfigFile.name;
    dep.dependents += 1;

    if (!_.isString(dep.main)) {
      // can't find the main file. this config file is useless!
      var warnings = config.get('warnings');

      warnings.push(component + ' was not injected in your file.');
      warnings.push(
        'Please go take a look in "'
        + path.join(config.get('directory'), component)
        + '" for the file you need, then manually include it in your file.');

      config.set('warnings', warnings);
      return;
    }

    if (componentConfigFile.dependencies) {
      dep.dependencies = componentConfigFile.dependencies;

      _.each(componentConfigFile.dependencies, gatherInfo(config));
    }

    config.get('global-dependencies').set(component, dep);
  };
};


/**
 * Compare two dependencies to determine priority.
 *
 * @param  {object} dependency      dependency a
 * @param  {object} lastDependency  dependency b
 * @return {number} the priority of dependency a in comparison to dependency b
 */
var dependencyComparator = function (dependency, lastDependency) {
  return Object.
    keys(dependency.dependencies).
    filter(function (dependency) {
      return dependency === lastDependency.name;
    }).length ? 1 : -1;
};


/**
 * Sort the dependencies in the order we can best determine they're needed.
 *
 * @param  {object} config    the global configuration object
 * @param  {string} fileType  the type of file to prioritize
 * @return {array} the sorted items of 'path/to/main/files.ext' sorted by type
 */
var prioritizeDependencies = function (config, fileType) {
  return _.toArray(config.get('global-dependencies').get()).
    filter(function (dep) {
      return dep.type === fileType;
    }).
    reduce(function (grouped, dependency) {
      grouped.push(dependency);
      return grouped.sort(dependencyComparator);
    }, []).
    map(function (dependency) {
      return dependency.main;
    });
};


/**
 * Detect dependencies of the components from `bower.json`.
 *
 * @param  {object} config the global configuration object.
 * @return {object} config
 */
module.exports = function detect(config) {
  _.each(config.get('bower.json').dependencies, gatherInfo(config));

  config.set('global-dependencies-sorted', {
    js: prioritizeDependencies(config, '.js'),
    css: prioritizeDependencies(config, '.css'),
    scss: prioritizeDependencies(config, '.scss')
  });

  return config;
};
