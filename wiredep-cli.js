#!/usr/bin/env node
'use strict';

var pkg = require('./package.json');
var wiredep = require('./wiredep');
var argv = require('minimist')(process.argv.slice(2));
var chalk = require('chalk');
var fs = require('fs');

var args = [
  { short: 'h', full: 'help' },
  { short: 'v', full: 'version' },
  { short: 'b', full: 'bowerJson' },
  { short: 'd', full: 'directory' },
  { short: 'e', full: 'exclude' },
  { short: 'i', full: 'ignorePath' },
  { short: 's', full: 'src' }
];

function help() {
  console.log(pkg.description);
  console.log('');
  console.log('Usage: ' + chalk.cyan('$') + chalk.bold(' wiredep ') + chalk.yellow('[options]'));
  console.log('');
  console.log('Options:');
  console.log('  -h, --help         # Print usage information');
  console.log('  -v, --version      # Print the version');
  console.log('  -b, --bowerJson    # Path to `bower.json`');
  console.log('  -d, --directory    # Your Bower directory');
  console.log('  -e, --exclude      # A path to be excluded');
  console.log('  -i, --ignorePath   # A path to be ignored');
  console.log('  -s, --src          # Path to your source file');
  console.log('  --dependencies     # Include Bower `dependencies`');
  console.log('  --devDependencies  # Include Bower `devDependencies`');
  console.log('  --includeSelf      # Include top-level `main` files');
  console.log('  --verbose          # Print the results of `wiredep`');
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
  console.log('Please pass a `--src path/to/source.html` to `wiredep`.');
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
    fs.statSync('./bower.json');
  }
} catch (e) {
  console.log(chalk.bold.red('> bower.json not found.'));
  console.log('Please run `wiredep` from the directory where your `bower.json` file is located.');
  console.log('Alternatively, pass a `--bowerJson path/to/bower.json`.');
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
