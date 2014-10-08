# require-wiredep
> Wire require config to many files

## Getting Started
Install the module with [npm](https://npmjs.org):

```bash
$ npm install --save require-wiredep
```

Insert placeholders in your code where your config will be injected:

```js
var config = {
  //require:default
  //endrequire
  }
```

Let `require-wiredep` work its magic:

```bash
$ node
> require('wiredep')({ src: 'main.js' });

main.js modified.
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `npm test`.


## License
Copyright (c) 2014 Pearson English. Licensed under the MIT license.