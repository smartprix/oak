import {expect} from 'chai';
import {
	Oak,
	BasicLogs,
	ConsoleLogs,
} from '../src';

describe('test all functions', () => {
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

	it('static fns should work', () => {
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

	it('instance fns should work', () => {
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

	it('label change on instance', () => {
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

describe('Tests with custom transport', () => {
	let logs = [];
	let skipped = [];
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

		Oak.setTransports(new TestLogs({level: 'error'}));
	});

	beforeEach(() => {
		logs = [];
		skipped = [];
	});

	it('Set transport should work', () => {
		Oak.log('test');
		expect(logs.length).to.equal(1);
		expect(new Date(logs[0].createdAt).toISOString()).to.equal(logs[0].createdAt);
		delete logs[0].createdAt;
		expect(logs[0]).to.deep.equal({
			level: 'silly',
			message: 'test',
			label: 'Default',
		});
	});

	it('time function should work with unique key', () => {
		Oak.time('k');
		Oak.timeEnd('k', 'test message');
		expect(logs[0].duration).to.be.lessThan(1);
		delete logs[0].createdAt;
		delete logs[0].duration;
		expect(logs[0]).to.deep.equal({
			level: 'info',
			message: 'test message',
			originalMessage: 'k',
			label: 'Default',
		});
	});

	it('time function should work without key', () => {
		const k = Oak.time();
		Oak.timeEnd(k, 'test message');

		expect(logs[0].duration).to.be.lessThan(1);
		delete logs[0].createdAt;
		delete logs[0].duration;
		expect(logs[0]).to.deep.equal({
			level: 'info',
			message: 'test message',
			label: 'Default',
		});
	});

	it('logTimeTaken should work', async function () {
		this.timeout(3500);
		const timer = async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, 2500);
			});
		};
		await Oak.logTimeTaken(timer);

		expect(logs[0].duration).to.be.lessThan(3000);
		expect(logs[0].duration).to.be.greaterThan(2000);
		delete logs[0].createdAt;
		delete logs[0].duration;
		expect(logs[0]).to.deep.equal({
			level: 'info',
			message: 'timer',
			label: 'Default',
		});
	});

	it('filters should work', () => {
		Oak.error('test');
		expect(logs.length).to.equal(0);
		expect(skipped.length).to.equal(1);
	});

	it('error parsing', () => {
		Oak.error({label: 'err'}, 'test message', new Error('err message'));
		delete skipped[0].error.stack;
		delete skipped[0].createdAt;
		expect(skipped[0]).to.deep.equal({
			label: 'err',
			level: 'error',
			message: 'test message',
			error: {
				message: 'err message',
				name: 'Error',
			},
		});

		Oak.error({label: 'err'}, new Error('err message'));
		delete skipped[1].error.stack;
		delete skipped[1].createdAt;
		expect(skipped[1]).to.deep.equal({
			label: 'err',
			level: 'error',
			message: 'err message',
			error: {
				message: 'err message',
				name: 'Error',
			},
		});
		expect(skipped.length).to.equal(2);
	});

	it('should log erros seperately', () => {
		Oak.warn('some', 'random', 5, 'things', new Error('err message'));
		expect(logs.length).to.equal(2);

		delete logs[0].error.stack;
		delete logs[0].createdAt;
		delete logs[1].createdAt;
		expect(logs[0]).to.deep.equal({
			message: 'err message',
			level: 'warn',
			error: {
				message: 'err message',
				name: 'Error',
			},
			label: 'Default',
		});
		expect(logs[1]).to.deep.equal({
			message: 'some random 5 things Error: err message',
			level: 'warn',
			label: 'Default',
		});
	});


	after(() => {
		Oak.setTransports(new ConsoleLogs());
	});
});
