import {WriteStream} from 'fs';

declare module '@smpx/oak' {
	interface plainObject {
		[key: string]: any;
	}

	type level = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
	
	class BasicLogs {
		constructor(opts: {level: level});
		log(info: plainObject): void;
		static formatter(info): any;
		static filterLogs(info: plainObject, level: level): boolean;
	}

	class ConsoleLogs extends BasicLogs {
	}

	class FileLogs extends BasicLogs {
		constructor(opts: {level: level, path: string, table: string, filter: boolean})
		static _getStream(opts: {path: string, table: string, regenerate?: boolean}): WriteStream;
	}

	class Oak {
		constructor(opts?: object | string);
	
		updateOptions(opts: object): void;
		getChild(opts?: object | string): Oak;
	
		log(...args: any[]): void;
		log(opts: plainObject, ...args: any[]): void;
		silly(...args: any[]): void;
		silly(opts: plainObject, ...args: any[]): void;
		debug(...args: any[]): void;
		debug(opts: plainObject, ...args: any[]): void;
		verbose(...args: any[]): void;
		verbose(opts: plainObject, ...args: any[]): void;
		info(...args: any[]): void;
		info(opts: plainObject, ...args: any[]): void;
		warn(...args: any[]): void;
		warn(opts: plainObject, ...args: any[]): void;
		error(...args: any[]): void;
		error(opts: plainObject, ...args: any[]): void;
	
		time(key?: string): string | number;
		timeEnd(key:string | number, ...arg: any[]): number;
		logTimeTaken<T>(fn: () => Promise<T> | T):Promise<T>;
		logTimeTaken<T>(message: string, fn: () => Promise<T> | T):Promise<T>;
		logTimeTaken<T>(opts: object, message: string, fn: () => Promise<T> | T):Promise<T>;
		
		options: {
			[key: string]: any,
		};
	
		static log(...args: any[]): void;
		static log(opts: plainObject, ...args: any[]): void;
		static silly(...args: any[]): void;
		static silly(opts: plainObject, ...args: any[]): void;
		static debug(...args: any[]): void;
		static debug(opts: plainObject, ...args: any[]): void;
		static verbose(...args: any[]): void;
		static verbose(opts: plainObject, ...args: any[]): void;
		static info(...args: any[]): void;
		static info(opts: plainObject, ...args: any[]): void;
		static warn(...args: any[]): void;
		static warn(opts: plainObject, ...args: any[]): void;
		static error(...args: any[]): void;
		static error(opts: plainObject, ...args: any[]): void;
	
		static time(key?: string): string | number;
		static timeEnd(key:string | number, ...arg: any[]): number;
		static logTimeTaken<T>(fn: () => Promise<T> | T):Promise<T>;
		static logTimeTaken<T>(message: string, fn: () => Promise<T> | T):Promise<T>;
		static logTimeTaken<T>(opts: object, message: string, fn: () => Promise<T> | T):Promise<T>;

		static installExitHandlers(): void;
		static installExceptionHandlers(): void;
		static setGlobalOptions(options: plainObject): void;

		static setTransports<T extends BasicLogs>(transports: T | T[]): void;
	
		static default: Oak;
	}
}