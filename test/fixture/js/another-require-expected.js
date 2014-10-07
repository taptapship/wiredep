var someVar = {};

var getConfig = function(config) {
	return config;
}

getConfig(
		//require:default

		{
		  "baseUrl": "",
		  "paths": {
		    "app": "scripts/app",
		    "bootstrap": "scripts/bootstrap",
		    "config": "scripts/config"
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
		    "/scripts/bootstrap.js"
		  ]
		}
		//endrequire
	);