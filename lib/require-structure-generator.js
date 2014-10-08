'use strict';

var $ = {
			_: require('lodash')
		},
		generate,
		insertion,
		config,
		requireConfig,
		indent;

generate = {
	baseUrl: generateBaseUrl,
	paths: generatePaths,
	packages: generatePackages,
	shim: generateShim,
	priority: generatePriority,
	deps: generateDeps,
	callback: generateCallback
};

insertion = {
	callback: insertCallback
};

function createStructureFromJson (cfg) {
	config = cfg;
	requireConfig = config.get('require.config');
	indent = config.get('indent') || 2;

	extendConfig(requireConfig);
	generateStrings(requireConfig);
}

function extendConfig (config) {
	var target;

	for (target in config) {
		if (config.hasOwnProperty(target) && target !== 'default') {
			config[target] = $._.merge({}, config['default'], config[target]);
		}
	}
}

function generateStrings (requireConfig) {
	var generatedStrings = {},
			generatedObjects = {},
			target;

	for (target in requireConfig) {
		if (requireConfig.hasOwnProperty(target)) {
				generatedObjects[target] = generateAll(target, requireConfig[target]);
				generatedStrings[target] = JSON.stringify(generatedObjects[target], null, "  ");
				generatedStrings[target] = insertionAll(generatedStrings[target], target, requireConfig[target]);
		}
	}

	config.set('generatedObjects', generatedObjects);
	config.set('generatedStrings', generatedStrings);
}

function generateAll (key, targetObj) {
	var all = {},
			property;

	for (property in targetObj) {
		if (targetObj.hasOwnProperty(property) && $._.isFunction(generate[property])) {
			all[property] = (generate[property](property, targetObj[property], key));
		}
	}

	return all;
}

function insertionAll (str, key, targetObj) {
	var strigifyObject = str,
			property;

	for (property in targetObj) {
		if (targetObj.hasOwnProperty(property) && $._.isFunction(insertion[property])) {
			strigifyObject = (insertion[property](str, property, targetObj[property], key));
		}
	}

	return strigifyObject;
}

function generateBaseUrl (key, obj) {
	return obj;
}

function generatePaths (key, obj, type) {
	var newPaths = {};

	$._.each(obj, function(value, key) {
		newPaths[key] = addPrefixAndPostfix(type, value);
	});

	return newPaths;
}

function generatePackages (key, obj, type) {
	var newArray = [],
			newObject;

	$._.each(obj, function(value) {
		newObject = $._.clone(value);
		newObject.location = addPrefixAndPostfix(type, value.location);
		newArray.push(newObject);
	});

	return newArray;
}

function generateShim (key, obj) {
	return obj;
}

function generatePriority (key, obj) {
	return obj;
}

function generateDeps (key, obj, type) {
	var newArray = [];

	$._.forEach(obj, function(value) {
		newArray.push(addPrefixAndPostfix(type, value));
	});

	return newArray;
}

function generateCallback () {
	return "{{callback}}";
}

function insertCallback (str, key, obj) {
	var result = '',
			injectStr;

	if ($._.isFunction(obj)) {
		injectStr = obj.toString();
	} else {
		injectStr = obj;
	}

	result = str.replace('"{{callback}}"', injectStr);

	return result;
}

function addPrefixAndPostfix (type, str) {
	var prefix = requireConfig[type].url_prefix || '',
			prefix_exclude = requireConfig[type].url_prefix_exclude,
			postfix = requireConfig[type].url_postfix || '',
			postfix_exclude = requireConfig[type].url_postfix_exclude;

	if ($._.isArray(prefix_exclude)) {
		$._.forEach(prefix_exclude, function(value) {
			if (str.search(value) !== -1) {
				prefix = "";
			}
		});
	}

	if ($._.isArray(postfix_exclude)) {
		$._.forEach(postfix_exclude, function(value) {
			if (str.search(value) !== -1) {
				postfix = "";
			}
		});
	}

	return [prefix, str, postfix].join('');
}

module.exports = createStructureFromJson;