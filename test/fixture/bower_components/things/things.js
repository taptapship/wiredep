/*!
 * things. it's so thingy.
 * v0.0.1 @stephenplusplus 3/22/13
 * github.com/stephenplusplus/things
 */

/**
 * things wrapper.
 *
 * @param  {object} root The global window object.
 * @return {undefined}
 */
(function(root) {
'use strict';

var
// Save a copy of toString to abuse.
__toString = ({}).toString,

/**
 * Checks if a given "thing" is of a certain "type".
 *
 * @param  {*}      thing The thing you're curious about.
 * @param  {string} type  The type you're matching the thing against.
 * @return {boolean}
 */
is = function (thing, type) {
  return typeof thing === type;
},

/**
 * Is this thing defined?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isDefined = function(thing) {
  return !isUndefined(thing);
},

/**
 * Is this thing undefined?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isUndefined = function(thing) {
  return is(thing, 'undefined');
},

/**
 * Is this thing a function?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isFunction = function(thing) {
  return __toString.call(thing) === '[object Function]';
},

/**
 * Is this thing a string?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isString = function(thing) {
  return __toString.call(thing) === '[object String]';
},

/**
 * Is this thing an array?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isArray = function(thing) {
  return __toString.call(thing) === '[object Array]';
},

/**
 * Is this thing a number?
 *
 * @param  {*} thing The thing you're curious about.
 * @return {boolean}
 */
isNumber = function(thing) {
  return __toString.call(thing) === '[object Number]';
};

/**
 * Internal jQuery/jQuery-esque API to interact with the DOM.
 *
 * @return {function} Immediately executed to privatize common functions.
 */
var $$ = (function($) {
  var jQueryPresent = isFunction($);

  // Let's save this, so we can loop over matches.
  var forEach = Array.prototype.forEach;

  /**
   * Private find method, which uses jQuery if available.
   *
   * @param  {HTMLElement|string} context The context to search within.
   * @return {function|undefined}         The bound find function.
   */
  var finder = function(context) {
    if (isDefined(context))
      return context.querySelectorAll.bind(context);
  };

  /**
   * Returns the jQuery-esque API, used internally and exposed as a default
   * dependency.
   *
   * @param  {string} arguments[0]
   * @return {object}
   */
  return function() {
    var api = {
      matches: null,

      /**
       * Looks within the matched DOM element for another element.
       *
       * @param  {string} element A DOM search parameter.
       * @return {object} api     The $$ api is returned to allow chaining.
       */
      find: function(element) {
        var context = finder(api.matches[0])
          , matched;

        if (isFunction(context))
          matched = context(element);

        if (isDefined(matched) && isDefined(matched[0]))
          api.matches = matched;

        return api;
      },

      /**
       * This function will update or return the innerHTML of an element.
       *
       * @param  {*|undefined} newContent A DOM search parameter.
       * @return {string|undefined}
       */
      html: function(newContent) {
        if (isUndefined(newContent))
          return api.matches[0].innerHTML;

        if (!isFunction(newContent) && !isArray(newContent))
          forEach.call(api.matches, function(match) {
            return match.innerHTML = newContent;
          });
      }
    };

    if (jQueryPresent)
      // We have jQuery, so we will use that, straight up!
      return $(arguments[0]);

    // jQuery isn't around, so we'll have to use our fallback.
    api.matches = finder(root.document)(arguments[0]);
    return api;
  }
})(root.jQuery);

var
// These are the different types of dependencies that can be registered.
dependencyTypes = ['route', 'service', 'thing'],

// `allOfTheThings` holds the things attached to each module that we pass
// around within the library (routes, services, etc).
allOfTheThings = {},

// `alOfTheThingsApis` holds the public API for the modules.
allOfTheThingsApis = {};

/**
 * When a route is invoked, this resolves what element matches the corresponding
 * route. It is stored on the route's object for later usage.
 *
 * @param  {object} module The module that contains the route.
 * @param  {string} route  The name of the route we are working with.
 * @return {undefined}
 */
var findRouteElements = function(module, route) {
  // We will use our internal `$$` to locate the matching elements.
  var dataroute = $$('[data-route="'+ route +'"]')
    , datael = dataroute.find('[data-el]');

  setProperty(module, 'route', route, 'dataroute', dataroute);

  setProperty(module, 'route', route, 'datael',
    isDefined(datael[0])
      ? datael
      : dataroute);
};

/**
 * When a route is invoked, return the matching element.
 *
 * @param  {object} module The module that contains the route.
 * @param  {string} route  The route we are going to look for the element on.
 * @return {$$}
 */
var getElForRoute = function(module, route) {
  findRouteElements(module, route);

  return getProperty(module, 'route', route, 'datael');
};

/**
 * When we "goTo" a route, we retrieve and execute (if necessary) the
 * dependencies of the route, as well as the dependencies of its dependencies,
 * and so on and so forth.
 *
 * @param  {object}    module The module containing the dependencies.
 * @param  {string}    route  The name of the route we are about to `goTo`.
 * @return {undefined}
 */
var invokeRoute = function(module, route) {
  // We are firing up a route, so let's store its name on our module.
  setModuleProperty(module, 'incomingRoute', route);

  // We begin the search for dependencies!
  setModuleProperty(module, 'requestingType', 'route');
  invokeDependency(module, route, 'route');

  // If we've made it here, we have switched from a previous route successfully.
  // We will update the `activeRoute` property on the module.
  setModuleProperty(module, 'activeRoute', route);
};

/**
 * The function behind all public APIs that allows dependency registration.
 *
 * @param  {object} module The module the dependency will be registered on.
 * @param  {string} type   The type of dependency being registered.
 * @param  {string} name   The name of the dependency.
 * @param  {*}      value  The value of the dependency.
 * @return {undefined}
 */
var registerDependency = function(module, type, name, value) {
  if (type === 'service'
    && !isFunction(value)
    && isUndefined(getProperty(module, 'service', name, 'invoked')))
    // If the dependency is a service that has not yet been invoked, we're more
    // picky about what the service type can be.
    throw new Error('Services must be functions!');

  var dependency = module[type][name] = value;

  // Create a hidden store for internal data related to this dependency.
  module[type]['__' + name] = {};

  // If the dependency is a function, we strip out the dependencies listed in
  // it's signature.
  if (isFunction(value)) {
    var dependencies = value.toString().match(/^\s*function\s*\((.*?)\)/);

    setProperty(module, type, name, 'dependencies',
      dependencies && dependencies[1] !== ''
        ? dependencies[1].replace(/\s/g, '').split(',')
        : []);
  }

  if (type === 'service' && isUndefined(getProperty(module, 'service', name, 'invoked')))
    // If the dependency is a service, we will specifiy that it has not yet
    // been invoked.
    setProperty(module, type, name, 'invoked', false);
};

/**
 * When we need a dependency, we start by passing in the module to search in,
 * and then as much information as we have. If all we know is the name, this
 * searches through the various types of dependencies, until a match is found.
 * We can also specify the name AND type of what we want, in which case it is
 * handed right to us.
 *
 * @param  {object}           module The module from where we're searching for
 *                                   the dependency.
 * @param  {string}           name   The name of the dependency we need.
 * @param  {string|undefined} type   The type of dependency we want.
 * @return {object}           returnDependency The dependency and type matched.
 */
var requestDependency = function(module, name, type) {
  var returnDependency = {
    dependencyType: undefined,
    dependency: undefined
  };

  if (isUndefined(name) && isUndefined(type))
    // Nothing provided to us! Abort!
    return returnDependency;

  if (isDefined(name) && isDefined(type))
    // We know exactly what we want.
    returnDependency.dependencyType = type,
    returnDependency.dependency = module[type][name];

  else
    // Let's go digging for it.
    returnDependency.dependency = dependencyTypes.filter(function(depType) {
      if (isDefined(module[depType][name])) {
        returnDependency.dependencyType = depType;
        return module[depType][name];
      }
    })[0];

  if (!returnDependency.dependency || !returnDependency.dependencyType)
    throw new Error(name + ' doesn\'t appear to be a thing.');

  return returnDependency;
};

/**
 * Let's invoke a dependency!
 *
 * @param  {object} module The module containing the dependencies.
 * @param  {string} name   The dependency we are trying to receive.
 * @param  {string} type   The type of dependency we want.
 * @return {*}      value  The value of the dependency can be anything!
 */
var invokeDependency = function(module, name, type) {
  if (isUndefined(name) || isUndefined(type))
    return undefined;

  var
  // Wire up our invokingFilter, used throughout the life of this function.
  filter = getModuleProperty(module, 'invokingFilter')(name, type),

  // Sniff out any dependencies this dependency may have.
  dependencies = getProperty(module, type, name, 'dependencies');

  // Using our `invokingFilter`, we get our initial value of the dependency.
  var value = filter.preInstantiation();

  if (isArray(dependencies))
    // Update the `requestingType` to store the dependency asking for the next
    // dependencies.
    setModuleProperty(module, 'requestingType', type);

  if (isFunction(value) && !getProperty(module, type, name, 'invoked'))
    // If the value is a function, but not a service that's been invoked, this
    // will take the first 10 dependencies listed and pass them into a `new`'d
    // value().
    value = new value(
      invokeDependency(module, dependencies[0], requestDependency(module, dependencies[0]).dependencyType),
      invokeDependency(module, dependencies[1], requestDependency(module, dependencies[1]).dependencyType),
      invokeDependency(module, dependencies[2], requestDependency(module, dependencies[2]).dependencyType),
      invokeDependency(module, dependencies[3], requestDependency(module, dependencies[3]).dependencyType),
      invokeDependency(module, dependencies[4], requestDependency(module, dependencies[4]).dependencyType),
      invokeDependency(module, dependencies[5], requestDependency(module, dependencies[5]).dependencyType),
      invokeDependency(module, dependencies[6], requestDependency(module, dependencies[6]).dependencyType),
      invokeDependency(module, dependencies[7], requestDependency(module, dependencies[7]).dependencyType),
      invokeDependency(module, dependencies[8], requestDependency(module, dependencies[8]).dependencyType),
      invokeDependency(module, dependencies[9], requestDependency(module, dependencies[9]).dependencyType)
    );

  // The value of the dependency might stay the same as it is currently in the
  // invokation, or it might need some additional processing. We'll run it
  // through the filter one last time to determine its final value, then return
  // that value.
  return filter.postInstantiation(value);
};

/**
 * When we're in the process of launching a new route, we'll need to manage a
 * lot of dependencies. Some have conditions which must be met before being
 * invoked. Others need to keep track of their "active" or "invoked" state and
 * subsequently re-registered.
 *
 * @param  {object}    module The module where our route's dependencies will be
 *                            matched.
 * @param  {string}    route  The name of the route we are going to launch.
 * @return {undefined}
 */
var prepareInvokingFilter = function(module) {
  // `preInstantiation` functions are passed the name and current value of the
  // dependency being requested. All functions must return a value that will
  // represent the dependency for the duration of the invokation.
  var preInstantiation = {
    /**
     * Boot functions typically don't requre filtering. However, should we need
     * to, we have the option.
     *
     * @this   {object} The name and value of the route being requested.
     * @return {*}      The value of the dependency being requested.
     */
    boot: function() {
      return this.value;
    },

    /**
     * If a route is being requested, we need to be sure it's the route we're
     * trying to launch, and not another route listed as a dependency.
     *
     * @this   {object} The name and value of the route being requested.
     * @return {*}      The value of the dependency being requested.
     */
    route: function() {
      if (this.name !== getModuleProperty(module, 'incomingRoute'))
        // If a route isn't yet active, someone is asking for a route. Bust 'em!
        this.value = 'Routes cannot be dependencies, sorry!';

      return this.value;
    },

    /**
     * A service is being requested as a dependency.
     *
     * @this   {object} The name and value of the service being requested.
     * @return {*}      The value of the dependency being requested.
     */
    service: function() {
      return this.value;
    },

    /**
     * A thing is being requested as a dependency.
     *
     * @this   {object} The name and value of the thing being requested.
     * @return {*}      The value of the dependency being requested.
     */
    thing: function() {
      if (this.name === '$el'
        && getModuleProperty(module, 'requestingType') === 'route'
        && getModuleProperty(module, 'incomingRoute') !== getModuleProperty(module, 'activeRoute'))
        this.value = getElForRoute(module, getModuleProperty(module, 'incomingRoute'));

      return this.value;
    }
  };

  // `postInstantiation` functions are passed the name and current value of the
  // dependency being requested. All functions must return a value that will
  // represent the dependency for the duration of the invokation.
  var postInstantiation = {
    /**
     * A boot is being requested as a dependency.
     *
     * @param  {*} value The value of the route being requested.
     * @return {*}       The value of the dependency being requested.
     */
    boot: function(value) {
      return value;
    },

    /**
     * A route is being requested as a dependency.
     *
     * @param  {*} value The value of the route being requested.
     * @return {*}       The value of the dependency being requested.
     */
    route: function(value) {
      return value;
    },

    /**
     * A service is being requested as a dependency.
     *
     * @param  {*} value The value of the service being requested.
     * @return {*}       The value of the dependency being requested.
     */
    service: function(value) {
      // Update the dependency in the module to store its returned value.
      registerDependency(module, 'service', this.name, value);

      // Switch the `invoked` property to true, so that we don't instantiate
      // it again later.
      setProperty(module, 'service', this.name, 'invoked', true);

      return value;
    },

    /**
     * A thing is being requested as a dependency.
     *
     * @param  {*} value The value of the thing being requested.
     * @return {*}       The value of the dependency being requested.
     */
    thing: function(value) {
      return value;
    }
  };

  /**
   * `invokingFilter` is stored on the module, and used during
   * `invokeDependency` to lint or process a dependency before instantiation and
   * after.
   *
   * @param  {string} name The name of the dependency being requested.
   * @param  {string} type The type of dependency being requested.
   * @return {object}      The pre and postInstantiation methods to process
   *                       the dependency injection before and after
   *                       instantiation.
   */
  setModuleProperty(module, 'invokingFilter', function(name, type) {
    var data = {
      name: name,
      value: requestDependency(module, name, type).dependency
    };

    return {
      preInstantiation: preInstantiation[type].bind(data),
      postInstantiation: postInstantiation[type].bind(data)
    };
  });
};

var

/**
 * Sets a property on the internal, hidden data store for the matching thing.
 *
 * @param  {object}    module
 * @param  {string}    type
 * @param  {string}    thing
 * @param  {string}    name
 * @param  {*}         value
 * @return {undefined}
 */
setProperty = function(module, type, thing, name, value) {
  if (type === 'module')
    module['__' + name] = value;
  else
    module[type]['__' + thing][name] = value;
},

/**
 * Returns a property on the internal, hidden data store for the matching thing.
 *
 * @param  {object}    module
 * @param  {string}    type
 * @param  {string}    thing
 * @param  {string}    name
 * @return {*}
 */
getProperty = function(module, type, thing, name) {
  if (type === 'module')
    return module['__' + name];
  else
    return module[type]['__' + thing][name];
},

/**
 * Sets a property on a module.
 *
 * @param  {object}    module
 * @param  {string}    name
 * @param  {*}         value
 * @return {undefined}
 */
setModuleProperty = function(module, name, value) {
  setProperty(module, 'module', null, name, value);
},

/**
 * Returns a property from a module.
 *
 * @param  {object}    module
 * @param  {string}    name
 * @return {*}
 */
getModuleProperty = function(module, name) {
  return getProperty(module, 'module', null, name);
};

/**
 * We will add things to the global object.
 *
 * @return {function}
 */
root.things = (function() {
  /**
   * The public API to create a new thing module and register other things.
   *
   * @param  {string} moduleName The name of the thing module being requested.
   * @return {object}            The api to interact with the thing module.
   */
  var things = function(moduleName) {
    if (!isString(moduleName) && !isNumber(moduleName))
      throw new Error('Hey! Give your things a name!');

    // `thingApi` is what will be returned to the user when a thing module is
    // created / asked for.
    var thingApi = allOfTheThingsApis[moduleName];

    // If `thingApi` is defined, that means the user has already registered
    // a module by this name, so we will return that module to them. This is
    // what allows for no variables to be created. Modules can come from
    // `things` directly, exposing all necessary APIs.
    if (isDefined(thingApi))
      return thingApi;

    // If this is a new module, we'll register it with the private object,
    // `allOfTheThings`. It's also referenced as `module` locally, as we will
    // be passing this module directly to all dependency register and
    // invocation functions.
    var module = allOfTheThings[moduleName] = {
      route: {},
      service: {},
      thing: {},
      boot: {}
    };

    // Prepare the invoking filter to be stored on the module.
    prepareInvokingFilter(module);

    // The default `root` dependency, which is just a refence to `window`.
    registerDependency(module, 'thing', 'root', window);

    // Another default `goTo` function, which just returns the `goTo`
    // function defined above.
    registerDependency(module, 'service', 'goTo', function() {
      return goTo;
    });

    // The default `$` dependency, the jQuery-esque API for the DOM.
    registerDependency(module, 'service', '$', function() {
      return $$;
    });

    // For routes, we provide a special `$el` to reference the route's element.
    registerDependency(module, 'thing', '$el', $$);

    /**
     * Returns a function bound to the correct dependency type.
     *
     * @param  {string} type What kind of dependency are we going to eventually
     *                       register?
     * @return {function}    The returned function will call registerDependency.
     */
    var createDependency = function(type) {
      /**
       * The function that is returned which will call registerDependency.
       *
       * @param  {string} name  The name of the thing being registered.
       * @param  {*}      value What is the value of this thing?
       * @return {undefined}
       */
      return function(name, value) {
        registerDependency(module, type, name, value);

        return allOfTheThingsApis[moduleName];
      }
    };

    /**
     * What is used to "go to" a route.
     *
     * @param  {string} route  Name of the route we're invoking.
     * @return {object} module The object used for interacting with the module.
     */
    var goTo = function(route) {
      invokeRoute(module, route);

      return allOfTheThingsApis[moduleName];
    };

    /**
     * Registers functions that intend to be invoked after the DOM is ready.
     *
     * @param  {function}         value  The function that will execute.
     * @return {object|undefined} module The object used for interacting with the
     *                                   module.
     */
    var boots = function(value) {
      if (!isFunction(value))
        return;

      // Create a random name for this boot function.
      var bootName = value.toString().substr(10, 30).replace(/[^\w]|\s/g, '');

      registerDependency(module, 'boot', bootName, value);

      if (isDOMLoaded)
        // If the DOM has already loaded, we'll invoke this immediately.
        invokeDependency(module, bootName, 'boot');

      return allOfTheThingsApis[moduleName];
    };

    /**
     * When the DOM has loaded, we can call our `module.boots()` functions
     * one-by-one.
     *
     * @return {undefined}
     */
    var isDOMLoaded = document.readyState === 'complete';
    root.onload = function() {
      isDOMLoaded = true;

      for (var bootName in module.boot)
        if (module.boot.hasOwnProperty(bootName) && bootName.charAt(0) !== '_')
          invokeDependency(module, bootName, 'boot');
     };

    // We return the public API for registering things, as well as store a
    // reference to it in `allOfTheThingsApis`.
    return allOfTheThingsApis[moduleName] = {
      route: createDependency('route'),
      service: createDependency('service'),
      thing: createDependency('thing'),
      goTo: goTo,
      boots: boots
    };
  };

  return things;
})();

})(window);