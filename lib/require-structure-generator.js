'use strict';

var $ = {
			_: require('lodash')
		},
		generate,
		config,
		requireJson,
		indent;

generate = {
	baseUrl: generateBaseUrl,
	paths: generatePaths,
	packages: generatePackages,
	shim: generateShim,
	priority: generatePriority,
	deps: generateDeps
};

function createStructureFromJson (cfg) {
	config = cfg;
	requireJson = config.get('require.json');
	indent = config.get('indent') || 2;

	extendConfig(requireJson);
	generateStrings(requireJson);
}

function extendConfig (config) {
	var target;

	for (target in config) {
		if (config.hasOwnProperty(target) && target !== 'default') {
			config[target] = $._.merge({}, config['default'], config[target]);
		}
	}
}

function generateStrings (requireJson) {
	var generatedStrings = {},
			generatedObjects = {},
			target;

	for (target in requireJson) {
		if (requireJson.hasOwnProperty(target)) {
				generatedObjects[target] = generateAll(target, requireJson[target]);
				generatedStrings[target] = JSON.stringify(generatedObjects[target], null, "  ");
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

function generateBaseUrl (key, obj) {
	return obj;
}

function generatePaths (key, obj, type) {
	var newPaths = {};

	$._.forEach(obj, function(value, key) {
		newPaths[key] = addPrefixAndPostfix(type, value);
	});

	return newPaths;
}

function generatePackages (key, obj, type) {
	var newArray = [],
			newObject;

	$._.forEach(obj, function(value) {
		newObject = value;
		newObject.location = addPrefixAndPostfix(type, newObject.location);
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

function addPrefixAndPostfix (type, str) {
	var prefix = requireJson[type].url_prefix || '',
			prefix_exclude = requireJson[type].url_prefix_exclude,
			postfix = requireJson[type].url_postfix || '',
			postfix_exclude = requireJson[type].url_postfix_exclude;

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