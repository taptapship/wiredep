var someVar = {};

var getConfig = function(config) {
	return config;
}

getConfig(
		//require:prefix

		{
		  "baseUrl": "",
		  "paths": {
		    "app": "app/scripts/app",
		    "bootstrap": "app/scripts/bootstrap",
		    "config": "app/scripts/config",
		    "angular": "app/bower_components/angular/angular",
		    "angular-resource": "app/bower_components/angular-resource/angular-resource",
		    "angularAMD": "app/bower_components/angularAMD/angularAMD",
		    "angular-mocks": "app/bower_components/angular-mocks/angular-mocks",
		    "ngload": "app/bower_components/angularAMD/ngload",
		    "text": "app/bower_components/requirejs-text/text",
		    "domReady": "app/bower_components/requirejs-domready/domReady"
		  },
		  "packages": [
		    {
		      "name": "myCourseWidget",
		      "location": "app/bower_components/myCourseWidget/dist/component/src",
		      "main": "js/component"
		    },
		    {
		      "name": "myCourseButtonWidget",
		      "location": "app/bower_components/myCourseButtonWidget/dist/component/src",
		      "main": "js/component"
		    }
		  ],
		  "shim": {
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
		  },
		  "priority": [
		    "angular",
		    "angularAMD"
		  ],
		  "deps": [
		    "app//scripts/bootstrap.js"
		  ]
		}
		//endrequire
	);