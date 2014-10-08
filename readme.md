# require-wiredep
> Wire require config to many files

## Getting Started
Install the module with [npm](https://npmjs.org):

```bash
$ npm install --save require-wiredep
```

## Prepare require-config.js file

```js
var config = {
  default: {
    "baseUrl": "",
    "paths": {
      "app": "scripts/app",
      "bootstrap": "scripts/bootstrap",
      "config": "scripts/config",
      "angular": "bower_components/angular/angular",
      "angularAMD": "bower_components/angularAMD/angularAMD",
      "angular-mocks": "bower_components/angular-mocks/angular-mocks"
    },
    "packages": [
      {
        "name": "myWidget",
        "location": "bower_components/myWidget/dist/component/src",
        "main": "js/component"
      },
    ],
    "shim": {
      "angularAMD": ["angular"],
      "angular-mocks": ["angular"],
      "angular-resource": ["angular"]
    },
    "priority": ["angular", "angularAMD"],

    "deps": ["/scripts/bootstrap.js"]
  },
  extended: {
    "baseUrl": "/base/",
    "paths": {
      "Api": "scripts/services/Api",
      "ApiResource": "scripts/services/ApiResource",
      "modalView": "views/NextStepWidget/modal.html"
    }
  },
  test: {
    "url_prefix": "app/",
    "url_postfix": "test",
    "url_prefix_exclude": ["bower_components"],
    "url_postfix_exclude": ["bower_components"],
    "callback": function() {
      console.log('do something');
    }
  }
};

Above you can see example config file for require-wiredep. 
Config can contain many targets with configs. Main and required target is default,
by using another targets we have possibility to extend default configuration.

module.exports = config;
```

## Insert placeholders in your code where your config will be injected

There is two possibilities to inject config to you file:

* Target style by using require:target placeholder

```js
var config = {
  //require:default
  //endrequire
  }
```

* Property style by using require:target:property placeholder

```js
var config = {
  "paths":
  //require:default:paths
  //endrequire
  }
```

## Let `require-wiredep` work its magic:

```bash
$ node
> require('require-wiredep')({ src: 'main.js' });

main.js modified.
```

## Supported properties of require config

* baseUrl
* paths
* packages
* shim
* priority
* deps
* callback

## Additional properties

* url_prefix - Add prefix to all url in config
* url_postfix - Add postfix to all url in config
* url_prefix_exclude - Exclude prefix for url consisting strings passed in array
* url_postfix_exclude - Exclude postfix for url consisting strings passed in array

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm test`.


## License
Copyright (c) 2014 Pearson English. Licensed under the MIT license.