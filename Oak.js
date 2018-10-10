import {cfg} from 'sm-utils';
import _ from 'lodash';
import util from 'util';

import {ConsoleLogs, FileLogs} from './Transports';
import {globalOptions} from './helpers';

const oakTransports = [
	new ConsoleLogs(),
];

// Enable on servers but not in test env
if (cfg.isProductionLike() || (process.env.SERVER && cfg.isDev())) {
	oakTransports.push(new FileLogs({dir: 'logs', table: globalOptions.table}));
}


/**
 * @type {Oak}
 */
let defaultOak;

class Oak {
	/**
	 * Get a logger instance with some options pre set
	 * @param {object|string} opts Default label if string
	 */
	constructor(opts = {}) {
		if (typeof opts === 'object') {
			this.instanceOpts = opts;
			this.instanceOpts.label = this.instanceOpts.label || 'None';
		}
		else {
			this.instanceOpts = {label: opts};
		}
		this.instanceOpts = _.defaults(this.instanceOpts, globalOptions);
		this.timers = {};
	}

	/**
	 * Round off number to precision level
	 * @param {number} number
	 * @param {number} precision
	 * @returns {number}
	 */
	static round(number, precision = 1) {
		/**
		* Round off number to precision level
	 	* @param {number} num
	 	* @param {number} prec
	 	* @returns {number}
	 	*/
		const shift = function (num, prec) {
			const numArray = ('' + num).split('e');
			return +(numArray[0] + 'e' + (numArray[1] ? (+numArray[1] + prec) : prec));
		};
		return shift(Math.round(shift(number, precision)), -precision);
	}

	static now() {
		const hrTime = process.hrtime();
		return (hrTime[0] * 1000) + (hrTime[1] / 1000000);
	}

	/**
	 * Elapsed time since a timestamp
	 * @param {number} since Epoch time from Monitor.now()
	 * @param {number} precision decimal digit precision
	 */
	static elapsed(since, precision = 1) {
		return this.round(this.now() - since, precision);
	}

	/**
	 * Update the default options object for the logger
	 * @param {object} opts
	 */
	updateOptions(opts = {}) {
		this.opts = _.merge(this.opts, opts);
	}

	/**
	 * @param {any[]} args
	 * @param {string} level
	 */
	_logWithLevel(args, level) {
		if (typeof args[0] === 'object') {
			args[0].level = level;
		}
		else {
			args = [{level}, ...args];
		}
		this.log(...args);
	}

	/**
	 * Default level is 'silly' if none is provided
	 * first arg may be an options object
	 */
	log(...args) {
		let opts = {};
		let rest = args;
		if (typeof args[0] === 'object') {
			opts = args[0];
			rest = args.slice(1);
		}
		opts.createdAt = new Date().toISOString();
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg instanceof Error) {
				// Log any errors individually
				this.error(arg);
				rest[i] = arg.message;
			}
		}
		const message = util.format(...rest);
		if (opts.message) {
			opts.originalMessage = opts.message;
		}
		opts.message = message;
		const infoObject = _.defaults(opts, this.instanceOpts);
		oakTransports.forEach((t) => {
			t.log(infoObject);
		});
	}

	silly(...args) {
		this._logWithLevel(args, 'silly');
	}

	debug(...args) {
		this._logWithLevel(args, 'debug');
	}

	verbose(...args) {
		this._logWithLevel(args, 'verbose');
	}

	info(...args) {
		this._logWithLevel(args, 'info');
	}

	warn(...args) {
		this._logWithLevel(args, 'warn');
	}

	error(...args) {
		this._logWithLevel(args, 'error');
	}

	/**
	 * @param {string} key
	 */
	time(key) {
		this.timers[key] = Oak.now();
	}

	/**
	 * @param {string} key
	 * @param {any[]} args
	 */
	timeEnd(key, ...args) {
		const since = this.timers[key];
		if (since) {
			const duration = Oak.elapsed(since);
			if (typeof args[0] === 'object') {
				args[0].level = 'info';
				args[0].duration = duration;
			}
			else {
				args = [{level: 'info', duration}, ...args];
			}
			this.log(args);

			delete this.timers[key];
		}
	}

	/**
	 * Returns a global default logger instance
	 * @returns {Oak}
	 */
	static init() {
		if (!defaultOak) defaultOak = new Oak('Default');
		return defaultOak;
	}

	static log(...args) {
		this.init().log(...args);
	}

	static silly(...args) {
		this.init().sillyt(...args);
	}

	static debug(...args) {
		this.init().debug(...args);
	}

	static verbose(...args) {
		this.init().verbose(...args);
	}

	static info(...args) {
		this.init().info(...args);
	}

	static warn(...args) {
		this.init().warn(...args);
	}

	static error(...args) {
		this.init().error(...args);
	}

	/**
	 * Starts a timer
	 * @param {string} key
	 */
	static time(key) {
		this.init().time(key);
	}

	/**
	 * @param {string} key
	 * @param {any[]} args
	 */
	static timeEnd(key, ...args) {
		this.init().timeEnd(key, ...args);
	}
}

Oak.init();

export default Oak;
