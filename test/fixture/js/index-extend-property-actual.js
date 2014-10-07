var someVar = {};

var getConfig = function(config) {
  return config;
}

getConfig({
  baseUrl:
  //require:extend:baseUrl

  "/base/"
  //endrequire
  shim: 
  //require:extend:paths

  {
    "app": "scripts/app",
    "bootstrap": "scripts/bootstrap",
    "config": "scripts/config",
    "angular": "bower_components/angular/angular",
    "angular-resource": "bower_components/angular-resource/angular-resource",
    "angularAMD": "bower_components/angularAMD/angularAMD",
    "angular-mocks": "bower_components/angular-mocks/angular-mocks",
    "ngload": "bower_components/angularAMD/ngload",
    "text": "bower_components/requirejs-text/text",
    "domReady": "bower_components/requirejs-domready/domReady",
    "xApi": "scripts/services/xApi",
    "xApiResource": "scripts/services/xApiResource",
    "modalView": "views/NextStepWidget/modal.html"
  }
  //endrequire
});