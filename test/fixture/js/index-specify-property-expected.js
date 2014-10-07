var someVar = {};

var getConfig = function(config) {
  return config;
}

getConfig({
  baseUrl:
  //require:default:baseUrl

  ""
  //endrequire
  shim: 
  //require:default:shim

  {
    "angularAMD": [
      "angular"
    ],
    "angular-mocks": [
      "angular"
    ],
    "angular-resource": [
      "angular"
    ],
    "bootstrap-tpl": [
      "angular"
    ]
  }
  //endrequire
});