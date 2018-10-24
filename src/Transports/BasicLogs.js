import _ from 'lodash';

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	verbose: 3,
	debug: 4,
	silly: 5,
};

export default class BasicLogs {
	/**
	 * @param {object} param0
	 * @param {string} param0.level
	 */
	constructor({level} = {}) {
		this.level = level;
	}

	static errorLevels = ['error', 'warn'];

	static formatter(info) {
		return info;
	}

	/**
	 * @param {object} info
	 * @returns {void}
	 */
	log(info) {
		if (BasicLogs.filterLogs(info, this.level)) return;
		const consoleLevel = BasicLogs.errorLevels.includes(info.level) ? 'error' : 'log';
		console[consoleLevel](BasicLogs.formatter(info));
	}

	/**
	 * Filter logs items by level
	 * @param {object} info
	 * @param {string|number} level
	 * @returns {boolean} don't show logs that return true
	 */
	static filterLogs(info, level) {
		if (_.isNil(level)) return false;
		if (!info || !info.level) return true;

		if (_.isString(level)) level = levels[level];
		const infoLevel = levels[info.level];

		// Log invalid level value
		if (!_.isSafeInteger(level) || !_.isSafeInteger(infoLevel)) return false;

		return infoLevel > level;
	}
}
