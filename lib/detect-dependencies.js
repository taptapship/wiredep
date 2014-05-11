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

  ['bower.json', '.bower.json', 'component.json', 'package.json'].
    forEach(function (configFile) {
      configFile = path.join(config.get('bower-directory'), component, configFile);

      if (!_.isObject(componentConfigFile) && fs.existsSync(configFile)) {
        componentConfigFile = JSON.parse(fs.readFileSync(configFile));
      }
    });

  return componentConfigFile;
};


/**
 * Return boolean representing the existence of a supplied suffix string in a filename
 *
 * @param  {string} str     a filename to check
 * @param  {string} suffix  the suffix to match
 * @return {boolean} true if the suffix exists, false otherwise
 */
var endsWith = function (str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};


/**
 * Return a string with the specified suffix removed
 *
 * @param  {string} str     a filename to check
 * @param  {string} suffix  the suffix to match
 * @return {boolean} string minux the specified suffix
 */
var removeSuffix = function (str, suffix) {
  return str.substr(0, str.length - suffix.length);
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
  var overrides = config.get('overrides');
  var filePaths = [];
  var file, minFile, minFilePath;

  if (overrides && overrides[component]) {
    if (overrides[component].dependencies) {
      componentConfigFile.dependencies = overrides[component].dependencies;
    }

    if (overrides[component].main) {
      componentConfigFile.main = overrides[component].main;
    }
  }

  if (_.isString(componentConfigFile.main)) {
    // start by looking for what every component should have: config.main
    filePaths = [componentConfigFile.main];
  } else if (_.isArray(componentConfigFile.main)) {
    filePaths = componentConfigFile.main;
  } else if (_.isArray(componentConfigFile.scripts)) {
    // still haven't found it. is it stored in config.scripts, then?
    filePaths = componentConfigFile.scripts;
  } else {
    file = path.join(config.get('bower-directory'), component, componentConfigFile.name + '.js');
    if (fs.existsSync(file)) {
      filePaths = [componentConfigFile.name + '.js'];
    }
  }

  return filePaths.map(function (file) {
    if (config.get('min')) {
      if (endsWith(file, '.js') && !endsWith(file, '.min.js')) {
        minFile = removeSuffix(file, '.js') + '.min.js';
        minFilePath = path.join(config.get('bower-directory'), component, minFile);
        if (fs.existsSync(minFilePath)) {
          file = minFile;
        }
      } else if (endsWith(file, '.css') && !endsWith(file, '.min.css')) {
        minFile = removeSuffix(file, '.css') + '.min.css';
        minFilePath = path.join(config.get('bower-directory'), component, minFile);
        if (fs.existsSync(minFilePath)) {
          file = minFile;
        }
      }
    }
    return path.join(config.get('bower-directory'), component, file);
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
      dependencies: {}
    };

    var componentConfigFile = findComponentConfigFile(config, component);
    var warnings = config.get('warnings');

    var mains = findMainFiles(config, component, componentConfigFile);
    var fileTypes = _.chain(mains).map(path.extname).unique().value();

    dep.main = mains;
    dep.type = fileTypes;
    dep.name = componentConfigFile.name;

    var depIsExcluded = _.find(config.get('exclude'), function (pattern) {
      return path.join(config.get('bower-directory'), component).match(pattern);
    });

    if (dep.main.length === 0 && !depIsExcluded) {
      // can't find the main file. this config file is useless!
      warnings.push(component + ' was not injected in your file.');
      warnings.push(
        'Please go take a look in "'
        + path.join(config.get('bower-directory'), component)
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
 * @param  {object} a  dependency a
 * @param  {object} b  dependency b
 * @return {number} the priority of dependency a in comparison to dependency b
 */
var dependencyComparator = function (a, b) {
  var aNeedsB = false;
  var bNeedsA = false;

  aNeedsB = Object.
    keys(a.dependencies).
    some(function (dependency) {
      return dependency === b.name;
    });

  if (aNeedsB) {
    return 1;
  }

  bNeedsA = Object.
    keys(b.dependencies).
    some(function (dependency) {
      return dependency === a.name;
    });

  if (bNeedsA) {
    return -1;
  }

  return 0;
};


/**
 * Take two arrays, sort based on their dependency relationship, then merge them
 * together.
 *
 * @param  {array} left
 * @param  {array} right
 * @return {array} the sorted, merged array
 */
var merge = function (left, right) {
  var result = [];
  var leftIndex = 0;
  var rightIndex = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (dependencyComparator(left[leftIndex], right[rightIndex]) < 1) {
      result.push(left[leftIndex++]);
    } else {
      result.push(right[rightIndex++]);
    }
  }

  return result.
    concat(left.slice(leftIndex)).
    concat(right.slice(rightIndex));
};


/**
 * Take an array and slice it in halves, sorting each half along the way.
 *
 * @param  {array} items
 * @return {array} the sorted array
 */
var mergeSort = function (items) {
  if (items.length < 2) {
    return items;
  }

  var middle = Math.floor(items.length / 2);

  return merge(
    mergeSort(items.slice(0, middle)),
    mergeSort(items.slice(middle))
  );
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

  var dependencies = mergeSort(
    _.toArray(config.get('global-dependencies').get()).
      filter(function (dependency) {
        return _.contains(dependency.type, fileType);
      }).
      filter(function (dependency) {
        if (_.contains(eliteDependencies, dependency.name)) {
          eliteDependenciesCaught.push(dependency.main);
        } else {
          return true;
        }
      })
    ).map(prop('main'));

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
 * Excludes dependencies that match any of the patterns.
 *
 * @param  {array} allDependencies  array of dependencies to filter
 * @param  {array} patterns         array of patterns to match against
 * @return {array} items that don't match any of the patterns
 */
var filterExcludedDependencies = function (allDependencies, patterns) {
  return _.transform(allDependencies, function (result, dependencies, fileType) {
    result[fileType] = _.reject(dependencies, function (dependency) {
      return _.find(patterns, function (pattern) {
        return dependency.match(pattern);
      });
    });
  });
};


/**
 * Detect dependencies of the components from `bower.json`.
 *
 * @param  {object} config the global configuration object.
 * @return {object} config
 */
module.exports = function detect(config) {
  var allDependencies = {};

  if (config.get('dependencies')) {
    _.assign(allDependencies, config.get('bower.json').dependencies);
  }

  if (config.get('dev-dependencies')) {
    _.assign(allDependencies, config.get('bower.json').devDependencies);
  }

  _.each(allDependencies, gatherInfo(config));

  config.set('global-dependencies-sorted', filterExcludedDependencies(
    config.get('detectable-file-types').
      reduce(function (acc, fileType) {
        if (!acc[fileType]) {
          acc[fileType] = prioritizeDependencies(config, '.' + fileType);
        }
        return acc;
      }, {}),
    config.get('exclude')
  ));

  return config;
};
