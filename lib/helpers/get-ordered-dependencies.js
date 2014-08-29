'use strict';


function returnOrderedDependencies(config) {
  return Object.keys(config.get('global-dependencies-sorted')).
    reduce(function (acc, depType) {
      if (config.get('global-dependencies-sorted')[depType].length) {
        acc[depType] = config.get('global-dependencies-sorted')[depType];
      }

      return acc;
    }, { packages: config.get('global-dependencies').get() });
}

module.exports = returnOrderedDependencies;

