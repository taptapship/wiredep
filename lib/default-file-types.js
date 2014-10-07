module.exports = {
  js: {
    block: /(([ \t]*)\/\/\s*require:*(\S*)\s)(\n|\r|.)*?(\/\/\s*endrequire\s*)/gi,
  }
};


module.exports['default'] = module.exports.js;
