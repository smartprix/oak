import BasicLogs from './BasicLogs';
import {formatter} from '../formatter';

/**
 * This is used because the default winston console transport outputs using stdin/stdout
 */
class ConsoleLogs extends BasicLogs {
	static formatter = formatter;
}

export default ConsoleLogs;
