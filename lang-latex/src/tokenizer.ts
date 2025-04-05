import { ListEnvName, TableEnvName, TabularEnvName } from './parser.terms.js';

const listEnvNames = new Set([
	'itemize',
	'compactitem',
	'enumerate',
	'compactenum',
	'description',
	'compactdesc',
]);

const tabularEnvNames = new Set(['tabular', 'tabularx', 'longtable']);

export function specializeEnvName(name: string) {
	if (listEnvNames.has(name)) {
		return ListEnvName;
	}

	if (tabularEnvNames.has(name)) {
		return TabularEnvName;
	}

	if (name === 'table') {
		return TableEnvName;
	}

	return -1;
}
