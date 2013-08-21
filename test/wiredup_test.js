'use strict';

var wiredep = require('../bin/wiredep');
var fs = require('fs');
var bowerJson = JSON.parse(fs.readFileSync('.tmp/bower.json'));

var expectedPath = '.tmp/index-expected.html';
var actualPath = '.tmp/index-actual.html';

var expected = String(fs.readFileSync(expectedPath));

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['wiredep'] = {
  replaceHtml: function(test) {
    var actual;

    wiredep({
      directory: '.tmp/bower_components',
      bowerJson: bowerJson,
      htmlFile: actualPath,
      ignorePath: '.tmp/'
    });

    actual = String(fs.readFileSync(actualPath));

    test.equal(actual, expected);

    test.done();
  }
};
