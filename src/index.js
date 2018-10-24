import {System} from 'sm-utils';
import Oak from './Oak';

process.on('uncaughtException', (error) => {
	Oak.error('Uncaught Exception', error);
	System.exit(1);
});

process.on('unhandledRejection', (error) => {
	Oak.error('Unhandled Rejection', error);
});

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

Oak.info('Application started');

export default Oak;
