import rotatingFileStream from 'rotating-file-stream';
import BasicLogs from './BasicLogs';

// Oak is not used in this file, because oak itself uses this

/**
 * @see https://www.npmjs.com/package/rotating-file-stream#function-filenametime-index
 * @param {Date} time
 * @param {number} index
 */
function fileNameGenerator(time) {
	if (!time) return `${this}.json`;

	const currentDate = moment(time).format('YYYY-MM-DD');
	return `${currentDate}-${this}.json`;
}

let counter = 0;

class FileLogs extends BasicLogs {
	static logStreams = {};

	/**
	 * @param {object} opts
	 * @param {string} opts.table
	 * @param {string} opts.path
	 * @param {string} opts.level
	 * @param {boolean} opts.filter
	 * @param {}
	 */
	constructor({table = 'log', level = 'silly', path = `${process.cwd()}/logs`, filter = false} = {}) {
		super({level});
		this.path = path;
		this.table = table;
		this.filter = filter;
		FileLogs._getStream(this);
	}

	/**
	 * @param {object} info
	 * @returns {string}
	 */
	static formatter(info) {
		return `${JSON.stringify(info, null, 0)}\n`;
	}

	/**
	 * @param {object} info
	 * @returns {void}
	 */
	log(info) {
		const stream = this.constructor._getStream(this);
		if (!stream) return;
		if (this.filter && this.constructor.filterLogs(info, this.level)) return;
		try {
			stream.write(this.constructor.formatter(info));
		}
		catch (err) {
			console.error(`${new Date().toLocaleString()} [FileStream] Could not write to stream`, err);
		}
	}

	/**
	 * @param {object} param0
	 * @param {string} param0.path
	 * @param {string} param0.table
	 * @param {boolean} param0.regenerate
	 * @returns {import('fs').WriteStream}
	 */
	static _getStream({path, table, regenerate = false}) {
		const key = `${path}-${table}`;
		if (!regenerate && (key in this.logStreams)) return this.logStreams[key];
		let newStream;

		try {
			newStream = rotatingFileStream(fileNameGenerator.bind(table), {
				interval: '1d',
				maxFiles: 10,
				path,
				immutable: true,
			});
		}
		catch (err) {
			console.error(`${new Date().toLocaleString()} [FileStream] error: Could not start file stream`, err);
			return null;
		}
		counter++;

		newStream.on('open', (filename) => {
			console.log(`${new Date().toLocaleString()} [FileStream] silly: Counter: ${counter}, New File: ${filename}`);
		});

		newStream.on('warning', (err) => {
			console.error(`${new Date().toLocaleString()} [FileStream] warn: Counter: ${counter}, Error in file stream ${key},`, err);
		});

		newStream.on('error', (err) => {
			console.error(`${new Date().toLocaleString()} [FileStream] error: Counter: ${counter}, Error in file stream ${key},`, err);
			// reopen stream
			setImmediate(() => this._getStream({table, regenerate: true, path}));
		});
		this.logStreams[key] = newStream;
		return newStream;
	}
}

export default FileLogs;
