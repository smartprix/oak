import {cfg} from 'sm-utils';
import _ from 'lodash';
import util from 'util';

import {ConsoleLogs, FileLogs} from './Transports';
import {globalOptions} from './helpers';

const useFileLogs = cfg.isProductionLike() || (process.env.SERVER && cfg.isDev());

class Oak {
	static transport = useFileLogs ? new FileLogs({dir: 'logs', table: globalOptions.table}) : new ConsoleLogs();

	/**
	 * Get a logger instance with some options pre set
	 * @param {object|string} opts Default label if string
	 */
	constructor(opts = {}) {
		this.instanceOpts = {};
		if (typeof opts === 'object') {
			this.instanceOpts = opts;
			this.instanceOpts.label = opts.label || 'None';
		}
		else {
			this.instanceOpts = {label: String(opts)};
		}
		this.instanceOpts = _.defaults(this.instanceOpts, globalOptions);
		this.timers = new Map();
	}

	/**
	 * @param {any[]} args
	 * @param {string|object} level or options object
	 */
	_logWithLevel(args, level = {}) {
		if (typeof level === 'string') level = {level};
		let opts = level;
		let rest = args;
		let message;
		if (_.isPlainObject(args[0])) {
			opts = _.defaults(args[0], opts);
			rest = args.slice(1);
		}
		let numErrors = 0;
		for (let i = 0; i < rest.length; i++) {
			const arg = rest[i];
			if (arg instanceof Error) {
				// Log any errors individually
				this._logWithLevel([_.defaults(Oak._parseError(arg), opts)]);
				rest[i] = arg.message;
				numErrors++;
			}
		}
		// If only error object, then don't log twice
		if (numErrors === rest.length && numErrors > 0) return;
		if (rest.length === 1 && _.isString(rest[0])) {
			message = rest[0];
		}
		else if (rest.length >= 1) {
			message = util.format(...rest);
		}

		opts.createdAt = new Date().toISOString();
		if (opts.message && message) {
			opts.originalMessage = opts.message;
		}
		opts.message = message || opts.message || 'undefined';

		const infoObject = _.defaultsDeep(opts, this.instanceOpts);
		Oak.transport.log(infoObject);
	}

	/**
	 * @param {Error} err
	 * @returns {object}
	 */
	static _parseError(err) {
		const opts = {
			error: {
				stack: err.stack,
				name: err.name || err.constructor.name || '',
				message: err.message,
			},
		};
		if (err.code) {
			_.set(opts, 'error.code', err.code);
		}
		// Model from 'xorm' UserError
		if (err.model) {
			opts.model = err.model;
		}
		if (err.statusCode) {
			_.set(opts, 'ctx.statusCode', err.statusCode);
		}
		return opts;
	}

	/**
	 * Update the default options object for the logger
	 * @param {object} opts
	 */
	updateOptions(opts = {}) {
		this.opts = _.merge(this.opts, opts);
	}

	/**
	 * Default level is 'silly' if none is provided
	 * first arg may be an options object
	 */
	log(...args) {
		this._logWithLevel(args);
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
	 * @param {string} [key] provide a key else a randomly generated one will be assigned
	 * @returns {string} the key
	 */
	time(key) {
		if (!key) key = Math.random();
		if (this.timers.size > 1000) {
			Oak.warn('Possible memory leak in oak timers');
			return key;
		}
		this.timers.set(key, process.hrtime());
		return key;
	}

	/**
	 * @param {string} key
	 * @param {any[]} args
	 */
	timeEnd(key, ...args) {
		const since = this.timers.get(key);
		if (since) {
			const hrTime = process.hrtime(since);
			const duration = _.round((hrTime[0] * 1000) + (hrTime[1] / 1000000), 2);

			this._logWithLevel(args, {level: 'info', duration, message: key});
			this.timers.delete(key);
			return duration;
		}
		return -1;
	}

	/**
	 * Returns a child logger with the same options as the current one plus any extra provided
	 * @param {string|object} opts
	 * @returns {Oak}
	 */
	getChild(opts = {}) {
		let childOpts;
		if (typeof opts === 'object') {
			childOpts = opts;
		}
		else {
			childOpts = {label: String(opts)};
		}
		return new Oak(_.defaultsDeep(childOpts, this.instanceOpts));
	}

	/**
	 * Returns a global default logger instance
	 * @returns {Oak}
	 */
	static get default() {
		if (!this._defaultOak) this._defaultOak = new Oak('Default');
		return this._defaultOak;
	}

	static log(...args) {
		this.default.log(...args);
	}

	static silly(...args) {
		this.default.silly(...args);
	}

	static debug(...args) {
		this.default.debug(...args);
	}

	static verbose(...args) {
		this.default.verbose(...args);
	}

	static info(...args) {
		this.default.info(...args);
	}

	static warn(...args) {
		this.default.warn(...args);
	}

	static error(...args) {
		this.default.error(...args);
	}

	/**
	 * Starts a timer
	 * @param {string} [key]
	 * @returns {string}
	 */
	static time(key) {
		return this.default.time(key);
	}

	/**
	 * @param {string} key
	 * @param {any[]} args
	 */
	static timeEnd(key, ...args) {
		return this.default.timeEnd(key, ...args);
	}
}

export default Oak;
