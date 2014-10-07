var someVar = {};

var getConfig = function(config) {
	return config;
}

getConfig(
		//require:prefix_exclude

		{
		  "baseUrl": "",
		  "paths": {
		    "app": "app/scripts/app",
		    "bootstrap": "app/scripts/bootstrap",
		    "config": "app/scripts/config",
		    "angular": "bower_components/angular/angular",
		    "angular-resource": "bower_components/angular-resource/angular-resource",
		    "angularAMD": "bower_components/angularAMD/angularAMD",
		    "angular-mocks": "bower_components/angular-mocks/angular-mocks",
		    "ngload": "bower_components/angularAMD/ngload",
		    "text": "bower_components/requirejs-text/text",
		    "domReady": "bower_components/requirejs-domready/domReady"
		  },
		  "packages": [
		    {
		      "name": "myCourseWidget",
		      "location": "bower_components/myCourseWidget/dist/component/src",
		      "main": "js/component"
		    },
		    {
		      "name": "myCourseButtonWidget",
		      "location": "bower_components/myCourseButtonWidget/dist/component/src",
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