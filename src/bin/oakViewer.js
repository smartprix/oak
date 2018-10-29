#! /usr/bin/env node
/* eslint-disable no-use-before-define */
import _ from 'lodash';
import util from 'util';
import Chalk from 'chalk';
import tail from '@smpx/tail';
import commander from 'commander';

const {version} = require('../../package.json');

const chalk = new Chalk.constructor({level: 2});

const omit = [
	'hostname',
	'app',
	'pm2Id',
	'version',
	'env',
	'appName',
	'level',
	'table',
	'branch',
	'label',
	'message',
	'duration',
	'createdAt',
	'error',
	'console',
];

const omitCtx = [
	'method',
	'url',
	'path',
	'ip',
	'country',
	'ipCountry',
	'statusCode',
];

const omitMap = _.invert(omit);
const omitCtxMap = _.invert(omitCtx);

const levelColors = {
	error: 'red',
	warn: 'gold',
	info: 'dodgerblue',
	verbose: 'cyan',
	debug: 'blue',
	silly: 'slategray',
};

function formatTime(data, ctx) {
	if (!data.createdAt) return '';
	ctx.bgColor = 'lightsteelblue';
	const time = moment(data.createdAt).format('DD MMM HH:mm:ss A');
	return chalk.bgKeyword(ctx.bgColor).keyword('black')(` ${time} `);
}

function formatLabel(data, ctx) {
	const label = data.label || 'Default';
	const color = levelColors[data.level] || levelColors.silly;
	const prevBg = ctx.bgColor;
	ctx.bgColor = color;
	return chalk.bgKeyword(ctx.bgColor).keyword(prevBg)('') + chalk.bgKeyword(ctx.bgColor).keyword('white').bold(` ${label} `) + chalk.keyword(ctx.bgColor)('') + ' ';
}

function formatMessage(data) {
	if (!data.message) return '';
	const color = levelColors[data.level] || levelColors.silly;
	let message = data.message;
	if (data.error && data.error.name) {
		message = `${data.error.name}: ${message}`;
	}
	let colorFn = chalk.keyword(color);
	if (data.level === 'error') {
		colorFn = colorFn.bold;
	}
	return colorFn(message);
}

function formatStack(data) {
	if (!data.error || !data.error.stack) return '';
	let stack = data.error.stack.split('\n');
	if (data.message === data.error.message) {
		stack = stack.slice(1);
	}
	stack = stack.map(line => line.replace(/^\s{4}/, '  ')).join('\n');
	return '\n' + chalk.keyword('orangered')(stack);
}

function formatDuration(data) {
	if (data.duration == null) return '';
	return chalk.bold(`: ${data.duration}ms`);
}

function formatValue(val, indent) {
	if (val === undefined) return chalk.keyword('gray').bold('undefined');
	if (val === null) return chalk.keyword('gray').bold('null');
	if (val === true) return chalk.keyword('yellow').bold('true');
	if (val === false) return chalk.keyword('yellow').bold('true');
	if (typeof val === 'number') return chalk.keyword('yellow').bold(val);
	if (typeof val === 'string') return chalk.keyword('green')(val);
	if (Array.isArray(val)) return chalk.keyword('gold')(util.inspect(val, {colors: false, compact: true}));
	return '\n' + formatObj(val, indent + 2);
}

function formatKeyValue(key, val, indent) {
	const keyFormat = chalk.keyword('steelblue').bold(`${key}: `);
	if (key === 'ctx') {
		return keyFormat + formatCtx(val, indent);
	}
	return keyFormat + formatValue(val, indent);
}

function formatCtx(ctx, indent) {
	const rest = {};
	for (const key in ctx) {
		if (key in omitCtxMap) continue;
		if (ctx[key]) {
			rest[key] = ctx[key];
		}
	}

	const statusCode = ctx.statusCode ? chalk.keyword('yellow').bold(ctx.statusCode) + ' ' : '';
	const countryInfo = ctx.country ? chalk.keyword('green')(`${ctx.ip} (${ctx.ipCountry || 'none'})`) + ' ' +
	formatKeyValue('country', ctx.country || 'none', indent) + '\n' : '';

	return statusCode +
		chalk.keyword('steelblue')(ctx.method) + ' ' +
		chalk.keyword('green')(ctx.url) + '\n' +
		_.repeat(' ', indent + 2) +
		chalk.keyword('steelblue').bold('ip: ') +
		countryInfo +
		formatObj(rest, indent + 2);
}

function formatObj(obj, indent) {
	let result = '';
	const spaces = _.repeat(' ', indent);
	// eslint-disable-next-line guard-for-in
	for (const key in obj) {
		result += spaces + formatKeyValue(key, obj[key], indent) + '\n';
	}

	return result.substring(0, result.length - 1);
}

function formatRest(data) {
	const rest = {};
	for (const key in data) {
		if (key in omitMap) continue;
		rest[key] = data[key];
	}

	if (!Object.keys(rest).length) return '';
	return '\n' + formatObj(rest, 2);
}

function formatApp(data, ctx) {
	const app = (data.appName || '').replace(/-(production|prod|dev|staging|test)$/, '');
	const pm2Id = data.pm2Id;
	if (!app && (!pm2Id || pm2Id < 0)) return '';
	const prevBg = ctx.bgColor;
	ctx.bgColor = 'steelblue';
	return chalk.bgKeyword(ctx.bgColor).keyword(prevBg)('') + chalk.bgKeyword(ctx.bgColor).keyword('lightcyan')(` ${app || 'none'} `) + chalk.bgKeyword(ctx.bgColor).keyword('ghostwhite')(`${pm2Id} `);
}

function format(data) {
	const ctx = {};
	return (
		formatTime(data, ctx) +
		formatApp(data, ctx) +
		formatLabel(data, ctx) +
		formatMessage(data, ctx) +
		formatDuration(data, ctx) +
		formatStack(data, ctx) +
		formatRest(data, ctx)
	);
}

// eslint-disable-next-line complexity
function filter(data, line, options) {
	if (
		options.appNames && options.appNames.length &&
		!options.appNames.some(appName => data.appName.includes(appName))
	) return false;
	if (
		options.notAppNames && options.notAppNames.length &&
		!options.notAppNames.every(appName => !data.appName.includes(appName))
	) return false;
	if (
		options.levels && options.levels.length &&
		!options.levels.includes(data.level.toLowerCase())
	) return false;
	if (
		options.notLevels && options.notLevels.length &&
		options.notLevels.includes(data.level.toLowerCase())
	) return false;
	if (
		options.labels && options.labels.length &&
		!options.labels.includes(data.label.toLowerCase())
	) return false;
	if (
		options.notLabels && options.notLabels.length &&
		options.notLabels.includes(data.label.toLowerCase())
	) return false;
	if (
		options.greps && options.greps.length &&
		!options.greps.some(grep => grep.test(line))
	) return false;
	if (
		options.notGreps && options.notGreps.length &&
		!options.notGreps.every(grep => !grep.test(line))
	) return false;
	return true;
}

function handleLine(line) {
	if (!line) return;
	const data = JSON.parse(line);
	console.log(format(data));
}

commander
	.version(version, '-v, --version')
	.description(
		chalk.bold('View logs generated by oak\'s FileLogs in awesome formatting\n') +
			chalk.cyan.bold('Examples:\n') +
			chalk.yellow('oak-viewer --err --lines=100\n') +
			chalk.yellow('oak-viewer sm-crawler --level=warn,err --label=knex,koa\n') +
			chalk.yellow('oak-viewer --grep=NotFoundError,InternalServerError\n') +
			chalk.bold('\nTo negate a condition you can prepend the value with ~\n') +
			chalk.cyan.bold('Examples:\n') +
			chalk.yellow('oak-viewer --level=~silly --label=~maxmind,~jsonld\n') +
			chalk.yellow('oak-viewer ~list-crawler --level=err --grep=~NotFoundError\n')
	)
	.usage('[app] [options]')
	.option('-p, --path [dir]', 'Path given to filelogs (default is logs folder in root dir)')
	.option('--file, --table', 'Table option given to FileLogs (default is \'log\')')
	.option('-d, --date', 'Date for which to view logs [format: YYYY-MM-DD]')
	.option('--err, --error', 'Only show errors')
	.option('--lines [lines]', 'Show this many previous lines (default 10)', parseInt)
	.option('--level [levels]', 'Only show these levels, --levels=info,err')
	.option('--label [labels]', 'Only show these labels, --labels=knex,koa')
	.option('--grep [regex]', 'Only show logs matching this regex, --grep=NotFoundError')
	.option('--fields [fields]', 'Only show these fields in a log message, --fields=level,ctx.url')
	.option('--match [match_regexes]', 'Advanced per field based filtering, --match="ctx.url:some_regex,sql:some_regex"')
	.parse(process.argv);

const options = {};
options.lines = 10;
if (commander.args && commander.args.length) {
	const appNames = commander.args.map(_.trim).filter(Boolean).map(_.toLower);
	options.appNames = options.appNames || [];
	options.notAppNames = options.notAppNames || [];
	appNames.forEach((appName) => {
		let prop = 'appNames';
		if (appName.startsWith('!') || appName.startsWith('~')) {
			appName = appName.substring(1);
			prop = 'notAppNames';
		}
		options[prop].push(appName);
	});
}
if (commander.error) {
	options.levels = options.levels || [];
	options.levels.push('error');
}
if (commander.level) {
	const levels = commander.level.split(',').map(_.trim).filter(Boolean).map(_.toLower);
	options.levels = options.levels || [];
	options.notLevels = options.notLevels || [];
	levels.forEach((level) => {
		let prop = 'levels';
		if (level.startsWith('!') || level.startsWith('~')) {
			level = level.substring(1);
			prop = 'notLevels';
		}
		if (level === 'err') level = 'error';
		options[prop].push(level);
	});
}
if (commander.label) {
	const labels = commander.label.split(',').map(_.trim).filter(Boolean).map(_.toLower);
	options.labels = options.labels || [];
	options.notLabels = options.notLabels || [];
	labels.forEach((label) => {
		let prop = 'labels';
		if (label.startsWith('!') || label.startsWith('~')) {
			label = label.substring(1);
			prop = 'notLabels';
		}
		options[prop].push(label);
	});
}
if (commander.lines) {
	options.lines = commander.lines;
}
if (commander.grep) {
	const greps = commander.grep.split(',').map(_.trim).filter(Boolean);
	options.greps = options.greps || [];
	options.notGreps = options.notGreps || [];
	greps.forEach((grep) => {
		let prop = 'greps';
		if (grep.startsWith('!') || grep.startsWith('~')) {
			grep = grep.substring(1);
			prop = 'notGreps';
		}
		grep = grep.replace(/[^.\\]\*/g, '.*');
		if (!grep.startsWith('^')) grep = `.*${grep}`;
		if (!grep.endsWith('$')) grep = `${grep}.*`;
		options[prop].push(new RegExp(grep, 'i'));
	});
}

const directory = commander.path || `${process.cwd()}/logs`;
const date = commander.date ? new Date(commander.date) : new Date();
const formattedDate = `${date.getFullYear()}-${_.padStart(date.getMonth() + 1, 2, '0')}-${_.padStart(date.getDate(), 2, '0')}`;
const file = `${directory}/${formattedDate}-${commander.table || 'log'}.json`;
const stream = tail(file, {
	numLines: options.lines,
	watch: true,
	filter: (line) => {
		if (!line) return false;
		const data = JSON.parse(line);
		data.level = data.level || 'silly';
		data.label = data.label || 'Default';
		data.message = data.message || '';
		data.appName = data.appName || '';
		return filter(data, line, options);
	},
});

stream.on('line', handleLine);
