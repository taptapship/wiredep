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
var helpers = require('./helpers');
var prop = helpers.prop;


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
 * @return {array} the array of paths to the component's primary file(s)
 */
var findMainFiles = function (config, component, componentConfigFile) {
  var filePaths = [];
  var file;

  if (_.isString(componentConfigFile.main)) {
    // start by looking for what every component should have: config.main
    filePaths = [componentConfigFile.main];
  } else if (_.isArray(componentConfigFile.main)) {
    filePaths = componentConfigFile.main;
  } else if (_.isArray(componentConfigFile.scripts)) {
    // still haven't found it. is it stored in config.scripts, then?
    filePaths = componentConfigFile.scripts;
  } else {
    file = path.join(config.get('directory'), component, componentConfigFile.name + '.js');
    if (fs.existsSync(file)) {
      filePaths = [componentConfigFile.name + '.js'];
    }
  }

  return filePaths.map(function (file) {
    return path.join(config.get('directory'), component, file);
  });
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
    var warnings = config.get('warnings');

    var mains = findMainFiles(config, component, componentConfigFile);
    var fileTypes = _.chain(mains).map(function (main) {
      return path.extname(main);
    }).unique().value();

    dep.main = mains;
    dep.type = fileTypes;
    dep.name = componentConfigFile.name;
    dep.dependents += 1;

    if (dep.main.length === 0) {
      // can't find the main file. this config file is useless!
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
    }).length ? 1 : 0;
};


/**
 * Some dependencies which we know should always come first.
 */
var eliteDependencies = [
  'es5-shim',
  'jquery',
  'zepto',
  'modernizr'
];


/**
 * Sort the dependencies in the order we can best determine they're needed.
 *
 * @param  {object} config    the global configuration object
 * @param  {string} fileType  the type of file to prioritize
 * @return {array} the sorted items of 'path/to/main/files.ext' sorted by type
 */
var prioritizeDependencies = function (config, fileType) {
  var eliteDependenciesCaught = [];

  var dependencies =
    _.toArray(config.get('global-dependencies').get()).
      filter(function (dependency) {
        return _.contains(dependency.type, fileType);
      }).
      reduce(function (grouped, dependency) {
        return grouped.push(dependency) && grouped.sort(dependencyComparator);
      }, []).
      filter(function (dependency) {
        if (_.contains(eliteDependencies, dependency.name)) {
          eliteDependenciesCaught.push(dependency.main);
        } else {
          return true;
        }
      }).
      map(prop('main'));

  eliteDependenciesCaught.
    forEach(function (dependency) {
      dependencies.unshift(dependency);
    });

  return _
    (dependencies).
      flatten().
      value().
      filter(function (main) {
        return path.extname(main) === fileType;
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
