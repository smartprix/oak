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

	it('error parsing', () => {
		Oak.error({label: 'err'}, 'test message', new Error('err message'));
		expect(errors[0]).to.equal(`\u001b[31m${new Date().toLocaleString()}\u001b[0m \u001b[31m\u001b[1m[err] \u001b[0m\u001b[31m\u001b[1merror\u001b[0m: \u001b[31mtest message\n\u001b[0m\u001b[31mError: err message\n    at Context.it (/home/smpx-170l/projects/oak/test/index.js:68:45)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:372:21)\n    at Test.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at Runner.runTest (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:455:10)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:573:12\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:369:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:379:7\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:303:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:342:7\n    at done (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:319:5)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:395:7)\n    at Hook.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:317:10)\n    at Immediate._onImmediate (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:347:5)\n    at runCallback (timers.js:705:18)\n    at tryOnImmediate (timers.js:676:5)\n    at processImmediate (timers.js:658:5)\u001b[0m`);

		Oak.error({label: 'err'}, new Error('err message'));
		expect(errors[1]).to.equal(`\u001b[31m${new Date().toLocaleString()}\u001b[0m \u001b[31m\u001b[1m[err] \u001b[0m\u001b[31m\u001b[1merror\u001b[0m: \u001b[31merr message\n\u001b[0m\u001b[31mError: err message\n    at Context.it (/home/smpx-170l/projects/oak/test/index.js:71:29)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:372:21)\n    at Test.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at Runner.runTest (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:455:10)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:573:12\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:369:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:379:7\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:303:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:342:7\n    at done (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:319:5)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:395:7)\n    at Hook.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:317:10)\n    at Immediate._onImmediate (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:347:5)\n    at runCallback (timers.js:705:18)\n    at tryOnImmediate (timers.js:676:5)\n    at processImmediate (timers.js:658:5)\u001b[0m`);
		expect(errors.length).to.equal(2);
	});

	it('should log erros seperately', () => {
		Oak.warn('some', 'random', 5, 'things', new Error('err message'));
		expect(errors.length).to.equal(2);
		expect(errors[0]).to.equal(`\u001b[33m${new Date().toLocaleString()}\u001b[0m \u001b[33m\u001b[1m[Default] \u001b[0m\u001b[33m\u001b[1mwarn\u001b[0m: \u001b[33merr message\n\u001b[0m\u001b[33mError: err message\n    at Context.it (/home/smpx-170l/projects/oak/test/index.js:77:43)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:372:21)\n    at Test.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at Runner.runTest (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:455:10)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:573:12\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:369:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:379:7\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:303:14)\n    at /home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:342:7\n    at done (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:319:5)\n    at callFn (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:395:7)\n    at Hook.Runnable.run (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runnable.js:364:7)\n    at next (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:317:10)\n    at Immediate._onImmediate (/home/smpx-170l/projects/oak/node_modules/mocha/lib/runner.js:347:5)\n    at runCallback (timers.js:705:18)\n    at tryOnImmediate (timers.js:676:5)\n    at processImmediate (timers.js:658:5)\u001b[0m`);
		expect(errors[1]).to.equal(`\u001b[33m${new Date().toLocaleString()}\u001b[0m \u001b[33m\u001b[1m[Default] \u001b[0m\u001b[33m\u001b[1mwarn\u001b[0m: \u001b[33msome random 5 things Error: err message\u001b[0m`);
	});

	after(() => {
		console.log = originalLog;
		console.error = originalError;
	});
});

describe('should set transport and tests with custom transport', () => {
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

		Oak.setTransports(new TestLogs('error'));
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

	after(() => {
		Oak.setTransports(new ConsoleLogs());
	});
});
