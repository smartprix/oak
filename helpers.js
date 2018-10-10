import os from 'os';
import _ from 'lodash';

import {version} from '../../package.json';

const globalOptions = {
	hostname: os.hostname(),
	app: 'smartprix',
	pm2Id: process.env.pm_id || -1,
	version,
	env: _.pick(process.env, ['APP', 'NODE_ENV']),
	appName: process.env.name,
	level: 'silly', // default level
	table: 'log',
};

export {
	globalOptions,
};

