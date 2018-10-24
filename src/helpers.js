import _ from 'lodash';

const globalOptions = {
	level: 'silly', // default level
};

function getGlobalOptions() {
	return globalOptions;
}

function setGlobalOptions(options = {}) {
	_.merge(globalOptions, options);
}

export {
	getGlobalOptions,
	setGlobalOptions,
	globalOptions,
};

