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
		  "deps": [
		    "/scripts/bootstrap.js"
		  ]
		}
		//endrequire
	);