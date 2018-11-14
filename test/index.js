import {expect} from 'chai';
import {
	Oak,
	BasicLogs,
	ConsoleLogs,
} from '../src';

describe('should log to console', () => {
	let logs = [];
	let errors = [];
	const originalLog = console.log;
	const originalError = console.error;
	let oak;

	before(() => {
		console.log = (...args) => {
			logs.push(...args);
		};
		console.error = (...args) => {
			errors.push(...args);
		};
		Oak.setGlobalOptions({});
		oak = new Oak('tester');
	});

	beforeEach(() => {
		logs = [];
		errors = [];
	});

	it('test static fns', () => {
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

	it('test instance fns', () => {
		oak.log('test');
		oak.silly('silly');
		oak.info('info');
		oak.debug('debug');
		oak.verbose('verbose');

		oak.warn('warn');
		oak.error('error');
		expect(logs.length).to.equal(5);
		expect(errors.length).to.equal(2);
	});

	it('test label change on instance', () => {
		Oak.log('test');
		oak.log('test');
		const classLog = logs[0];
		const instanceLog = logs[1];

		expect(classLog).to.equal(`\u001b[0m${new Date().toLocaleString()}\u001b[0m \u001b[0m\u001b[1m[Default] \u001b[0m\u001b[0m\u001b[1msilly\u001b[0m: \u001b[0mtest\u001b[0m`);
		expect(instanceLog).to.equal(`\u001b[0m${new Date().toLocaleString()}\u001b[0m \u001b[0m\u001b[1m[tester] \u001b[0m\u001b[0m\u001b[1msilly\u001b[0m: \u001b[0mtest\u001b[0m`);
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
