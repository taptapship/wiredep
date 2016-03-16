#!/usr/bin/env node
'use strict';

var pkg = require('./package.json');
var wiredep = require('./wiredep');
var argv = require('minimist')(process.argv.slice(2));
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var EOL = require('os').EOL;

var args = [
  { short: 'h', full: 'help', desc: 'Print usage information' },
  { short: 'v', full: 'version', desc: 'Print the version' },
  { short: 'b', full: 'bowerJson', desc: 'Path to `bower.json`' },
  { short: 'd', full: 'directory', desc: 'Your Bower directory' },
  { short: 'e', full: 'exclude', desc: 'A path to be excluded' },
  { short: 'i', full: 'ignorePath', desc: 'A path to be ignored' },
  { short: 's', full: 'src', desc: 'Path to your source file' },
  { full: 'dependencies', desc: 'Include Bower `dependencies`' },
  { full: 'devDependencies', desc: 'Include Bower `devDependencies`' },
  { full: 'includeSelf', desc: 'Include top-level `main` files' },
  { full: 'verbose', desc: 'Print the results of `wiredep`' }
];

if (argv.v || argv.version) {
  console.log(pkg.version);
  return;
}

if (argv.h || argv.help || Object.keys(argv).length === 1) {
  console.log(
    pkg.description + EOL +
    EOL +
    'Usage: ' + chalk.cyan('$') + chalk.bold(' wiredep ') +
    chalk.yellow('[options]') + EOL +
    EOL +
    'Options:' + EOL +
    args.map(function (arg) {
      var line =  ' ' + (arg.short ? '-' + arg.short + ', ' : '') +
      '--' + arg.full;
      return line + (new Array(22 - line.length)).join(' ') + ' # ' + arg.desc;
    }).join(EOL)
  );
  return;
}

if (!argv.s && !argv.src) {
  console.log(
    chalk.bold.red('> Source file not specified.') + EOL +
    'Please pass a `--src path/to/source.html` to `wiredep`.'
  );
  return;
}

if (argv.b || argv.bowerJson) {
  try {
    argv.bowerJson = JSON.parse(fs.readFileSync(argv.b || argv.bowerJson));
    delete argv.b;
  } catch (e) {}
}

try {
  if (!argv.bowerJson) {
    fs.statSync(path.normalize('./bower.json'));
  }
} catch (e) {
  console.log(
    chalk.bold.red('> bower.json not found.') + EOL +
    'Please run `wiredep` from the directory where your `bower.json` file' +
    ' is located.' + EOL +
    'Alternatively, pass a `--bowerJson path/to/bower.json`.'
  );
  return;
}

var results = wiredep(Object.keys(argv).reduce(function (acc, arg) {
  args.filter(function (argObj) {
    if (argObj.short === arg) {
      acc[argObj.full] = argv[arg];
      delete acc[arg];
    }
  });
  return acc;
}, argv));

if (argv.verbose) {
  console.log(results);
}
