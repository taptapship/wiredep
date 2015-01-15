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
	waitSeconds: generateWaitSeconds,
	callback: generateCallback
};

insertion = {
	callback: insertCallback
};

/**
 * Create structure for all targets by extending 
 * and generate strings after that
 * @param  {object} cfg config file passed from main file
 */
function createStructureFromJson (cfg) {
	config = cfg;
	requireConfig = config.get('require.config');
	indent = config.get('indent') || 2;

	extendConfig(requireConfig);
	generateStrings(requireConfig);
}

/**
 * Extending by merge default target with other 
 * @param  {object} config object
 */
function extendConfig (config) {
	var target;

	for (target in config) {
		if (config.hasOwnProperty(target) && target !== 'default') {
			config[target] = $._.merge({}, config['default'], config[target]);
		}
	}
}

/**
 * Generating strings for all properties contains in requireConfig
 * @param  {object} requireConfig configuration
 */
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

/**
 * Executing string generation function for all of properties
 * @param  {string} key       target name
 * @param  {object} targetObj configuration for certain target
 */
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

/**
 * Inserting string to existing generated strings by generateAll function
 * @param  {string} str       string after generation
 * @param  {string} key       target name
 * @param  {object} targetObj configuration object for current target
 */
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

/**
 * Generating string for BaseUrl
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @return {string}     generated value
 */
function generateBaseUrl (key, obj) {
	return obj;
}

/**
 * Generating all paths as a string and adding 
 * prefix and postix to them
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @param  {string} type target name
 * @return {string}      generated strings
 */
function generatePaths (key, obj, type) {
	var newPaths = {};

	$._.each(obj, function(value, key) {
		newPaths[key] = addPrefixAndPostfix(type, value);
	});

	return newPaths;
}

/**
 * Generating packages properties as a string with 
 * redefining url
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @param  {string} type target name
 * @return {string}      generated strings
 */
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

/**
 * Generating string for Shim
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @return {string}     generated value
 */
function generateShim (key, obj) {
	return obj;
}

/**
 * Generating string for priority
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @return {string}     generated value
 */
function generatePriority (key, obj) {
	return obj;
}


/**
 * Generating deps properties as a string with 
 * redefining url
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @param  {string} type target name
 * @return {string}      generated strings
 */
function generateDeps (key, obj, type) {
	var newArray = [];

	$._.forEach(obj, function(value) {
		newArray.push(addPrefixAndPostfix(type, value));
	});

	return newArray;
}

/**
 * Generating waitSeconds properties
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @param  {string} type target name
 * @return {string}      generated strings
 */
function generateWaitSeconds (key, obj) {
	return obj;
}

/**
 * Return placeholder to generated strings. Callback will
 * be inserted in this place by insertion function
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @return {string}     placeholder
 */
function generateCallback () {
	return "{{callback}}";
}

/**
 * Inserting function or string in place of previously inserted placesholder
 * @param  {string} key property name
 * @param  {object} obj object passed by generate all function 
 * @return {string}     placeholder
 * @return {string}     string with replaces value
 */
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

/**
 * Adding prefix and postfix for passed url
 * and checking excludions determineted for 
 * current target name
 * @param {string} type target name
 * @param {string} url  passed url
 * @return {string}     string with replaces value
 */
function addPrefixAndPostfix (type, url) {
	var prefix = requireConfig[type].url_prefix || '',
			prefix_exclude = requireConfig[type].url_prefix_exclude,
			postfix = requireConfig[type].url_postfix || '',
			postfix_exclude = requireConfig[type].url_postfix_exclude;

	if ($._.isArray(prefix_exclude)) {
		$._.forEach(prefix_exclude, function(value) {
			if (url.search(value) !== -1) {
				prefix = "";
			}
		});
	}

	if ($._.isArray(postfix_exclude)) {
		$._.forEach(postfix_exclude, function(value) {
			if (url.search(value) !== -1) {
				postfix = "";
			}
		});
	}

	return [prefix, url, postfix].join('');
}

module.exports = createStructureFromJson;