#!/usr/bin/env node
'use strict';

var pkg = require('./package.json');
var require_wiredep = require('./require-wiredep');
var argv = require('minimist')(process.argv.slice(2));
var chalk = require('chalk');
var fs = require('fs');

var args = [
  { short: 'h', full: 'help' },
  { short: 'v', full: 'version' },
  { short: 'b', full: 'requireJson' },
  { short: 'd', full: 'directory' },
  { short: 'e', full: 'exclude' },
  { short: 'i', full: 'ignorePath' },
  { short: 's', full: 'src' }
];

function help() {
  console.log(pkg.description);
  console.log('');
  console.log('Usage: ' + chalk.cyan('$') + chalk.bold(' require-wiredep ') + chalk.yellow('[options]'));
  console.log('');
  console.log('Options:');
  console.log('  -h, --help         # Print usage information');
  console.log('  -v, --version      # Print the version');
  console.log('  -b, --requireJson    # Path to `require.json`');
  console.log('  -s, --src          # Path to your source file');
  // console.log('  --verbose          # Print the results of `require-wiredep`');
}

if (argv.v || argv.version) {
  console.log(pkg.version);
  return;
}

if (argv.h || argv.help || Object.keys(argv).length === 1) {
  help();
  return;
}

if (!argv.s && !argv.src) {
  console.log(chalk.bold.red('> Source file not specified.'));
  console.log('Please pass a `--src path/to/source.html` to `require-wiredep`.');
  return;
}

if (argv.b || argv.requireJson) {
  try {
    argv.b = JSON.parse(fs.readFileSync(argv.b || argv.requireJson));
  } catch (e) {}
}

try {
  if (!argv.requireJson) {
    fs.statSync('./require.json');
  }
} catch (e) {
  console.log(chalk.bold.red('> require.json not found.'));
  console.log('Please run `require-wiredep` from the directory where your `require.json` file is located.');
  console.log('Alternatively, pass a `--requireJson path/to/require.json`.');
  return;
}

var results = require_wiredep(Object.keys(argv).reduce(function (acc, arg) {
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
