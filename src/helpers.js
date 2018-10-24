import _ from 'lodash';

const globalOptions = {
	level: 'silly', // default level
};

function setGlobalOptions(options = {}) {
	_.merge(globalOptions, options);
}

export {
	setGlobalOptions,
	globalOptions,
};

