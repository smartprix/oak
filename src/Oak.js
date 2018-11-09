import {System} from 'sm-utils';
import _ from 'lodash';
import util from 'util';

import {ConsoleLogs} from './Transports';
import {getGlobalOptions, setGlobalOptions} from './helpers';

class Oak {
	static transports = [new ConsoleLogs()];

	/**
	 * Get a logger instance with some options pre set
	 * @param {object|string} opts Default label if string
	 */
	constructor(opts = {}) {
		this.options = {};
		if (typeof opts === 'object') {
			this.options = opts;
			this.options.label = opts.label || 'None';
		}
		else {
			this.options = {label: String(opts)};
		}
		this.options = _.defaults(this.options, getGlobalOptions());
		this.timers = new Map();
	}
	/**
	 * @ignore
	 * @param {Error} err
	 * @returns {object}
	 */
	static _parseError(err, opts = {}) {
		const obj = {
			error: {
				stack: err.stack,
				name: err.name || err.constructor.name || '',
				message: err.message,
			},
		};
		if (err.code) {
			obj.error.code = err.code;
		}
		// Model from 'xorm' UserError
		if (err.model) {
			obj.model = err.model;
		}
		if (err.statusCode) {
			_.set(obj, 'ctx.statusCode', err.statusCode);
		}
		return _.defaults(obj, opts);
	}

	/**
	 * @ignore
	 * @param {any[]} args
	 * @param {string|object} level or options object
	 */
	_logWithLevel(args, level = {}) {
		if (typeof level === 'string') level = {level};
		let opts = level;
		let rest = args;
		let message;
		let numErrors = 0;
		if (_.isPlainObject(args[0])) {
			opts = _.defaults(args[0], opts);
			rest = args.slice(1);
		}
		opts.createdAt = new Date().toISOString();

		// When only a string is passed
		if (rest.length === 1 && _.isString(rest[0])) {
			message = rest[0];
		}
		// Handles special case log('msg', new Error('err'))
		else if (rest.length === 2 && _.isString(rest[0]) && _.isError(rest[1])) {
			opts = Oak._parseError(rest[1], opts);
			if (!opts.level) opts.level = 'error';
			message = rest[0];
		}
		else if (rest.length >= 1) {
			for (let i = 0; i < rest.length; i++) {
				const arg = rest[i];
				if (arg instanceof Error) {
					// Log any errors individually
					const errorObj = Oak._parseError(arg, opts);
					if (!errorObj.level) errorObj.level = 'error';
					this._logWithLevel([errorObj, arg.message]);
					rest[i] = `${errorObj.error.name}: ${arg.message}`;
					numErrors++;
				}
			}
			// If only error object, then don't log twice
			if (numErrors === rest.length && numErrors > 0) return;
			message = util.format(...rest);
		}

		if (opts.message !== undefined) {
			if (message !== undefined) {
				opts.originalMessage = opts.message;
				opts.message = message;
			}
		}
		else if (message !== undefined) {
			opts.message = message;
		}
		else {
			opts.message = 'undefined';
		}

		let transports;
		if (this.transports) transports = this.transports;
		else transports = Oak.transports;
		transports.forEach((transport) => {
			if (transport.log) {
				transport.log(_.defaultsDeep(opts, this.options));
			}
		});
	}

	/**
	 * Update the default options object for the logger
	 * @param {object} options
	 */
	updateOptions(options = {}) {
		this.options = _.merge(this.options, options);
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
	 * @returns {string | number} the key
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
	 * if key is string then only it is logged
	 * @param {string | number} key
	 * @param {any[]} args
	 */
	timeEnd(key, ...args) {
		const since = this.timers.get(key);
		if (since) {
			const hrTime = process.hrtime(since);
			const duration = _.round((hrTime[0] * 1000) + (hrTime[1] / 1000000), 2);
			let message;
			if (_.isString(key)) message = key;
			this._logWithLevel(args, {level: 'info', duration, message});
			this.timers.delete(key);
			return duration;
		}
		return -1;
	}

	async logTimeTaken(...args) {
		const key = this.time();
		const fn = args.pop();
		const result = await fn();
		if (args.length === 0 && fn.name) args.push(fn.name);
		this.timeEnd(key, ...args);
		return result;
	}

	/**
	 * Returns a child logger with the same options and transport
	 * as the current one plus any extra provided
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
		const child = new Oak(_.defaultsDeep(childOpts, this.options));
		if (this.transports) {
			child.setTransports(this.transports);
		}
		return child;
	}

	setTransports(transports = new ConsoleLogs()) {
		if (!_.isArray(transports)) transports = [transports];
		this.transports = transports;
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

	static async logTimeTaken(...args) {
		return this.default.logTimeTaken(...args);
	}

	static installExitHandlers() {
		process.on('exit', (code) => {
			Oak.info({code}, 'Process exited with code', code);
			System.exit(code);
		});

		process.once('SIGINT', () => {
			Oak.info('Received SIGINT.');
			System.exit();
		});

		process.once('SIGTERM', () => {
			Oak.info('Received SIGTERM.');
			System.exit();
		});
	}

	static installExceptionHandlers() {
		process.on('uncaughtException', (error) => {
			Oak.error('Uncaught Exception', error);
			System.exit(1);
		});

		process.on('unhandledRejection', (error) => {
			Oak.error('Unhandled Rejection', error);
		});
	}

	static setGlobalOptions = setGlobalOptions;

	static setTransports(transports = new ConsoleLogs()) {
		if (!_.isArray(transports)) transports = [transports];
		this.transports = transports;
	}
}

export default Oak;
