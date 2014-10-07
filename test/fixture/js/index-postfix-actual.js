var someVar = {};

var getConfig = function(config) {
	return config;
}

getConfig(
		//require:postfix

		{
		  "baseUrl": "",
		  "paths": {
		    "app": "scripts/apptest",
		    "bootstrap": "scripts/bootstraptest",
		    "config": "scripts/configtest",
		    "angular": "bower_components/angular/angulartest",
		    "angular-resource": "bower_components/angular-resource/angular-resourcetest",
		    "angularAMD": "bower_components/angularAMD/angularAMDtest",
		    "angular-mocks": "bower_components/angular-mocks/angular-mockstest",
		    "ngload": "bower_components/angularAMD/ngloadtest",
		    "text": "bower_components/requirejs-text/texttest",
		    "domReady": "bower_components/requirejs-domready/domReadytest"
		  },
		  "packages": [
		    {
		      "name": "myCourseWidget",
		      "location": "bower_components/myCourseWidget/dist/component/srctest",
		      "main": "js/component"
		    },
		    {
		      "name": "myCourseButtonWidget",
		      "location": "bower_components/myCourseButtonWidget/dist/component/srctest",
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
		    "/scripts/bootstrap.jstest"
		  ]
		}
		//endrequire
	);