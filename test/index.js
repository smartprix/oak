import {expect} from 'chai';
import {
	Oak,
	BasicLogs,
	ConsoleLogs,
} from '../src';

describe('should log to console', () => {
	const logs = [];
	const errors = [];
	const originalLog = console.log;
	const originalError = console.error;
	before(() => {
		console.log = (...args) => {
			logs.push(...args);
		};
		console.error = (...args) => {
			errors.push(...args);
		};
		Oak.setGlobalOptions({});
	});

	it('test static fns', async () => {
		Oak.log('test');
		Oak.silly('silly');
		Oak.info('info');
		Oak.debug('debug');
		Oak.verbose('verbose');

		Oak.warn('warn');
		Oak.error('error');
		expect(logs.length).to.equal(5);
		expect(errors.length).to.equal(2);
	});

	after(() => {
		console.log = originalLog;
		console.error = originalError;
	});
});

describe('should set transport', () => {
	const logs = [];
	const skipped = [];
	before(() => {
		class TestLogs extends BasicLogs {
			log(info) {
				if (TestLogs.filterLogs(info, this.level)) {
					skipped.push(info);
					return;
				}
				logs.push(info);
			}
		}

		Oak.setTransports(new TestLogs());
	});

	it('Set transport should work', () => {
		Oak.log('test');
		expect(logs.length).to.equal(1);
	});

	after(() => {
		Oak.setTransports(new ConsoleLogs());
	});
});
