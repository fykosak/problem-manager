import { ListEnvName } from './parser.terms.js';

const listEnvNames = new Set([
	'itemize',
	'compactitem',
	'enumerate',
	'compactenum',
	'description',
	'compactdesc',
]);

export function specializeEnvName(name: string) {
	if (listEnvNames.has(name)) {
		return ListEnvName;
	}

	return -1;
}
