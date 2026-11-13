import { Stack } from '@lezer/lr';

import {
	DelimiterCommandIdentifier,
	ElseCommandIdentifier,
	IfCommandIdentifier,
	IfEndCommandIdentifier,
	ListEnvName,
	TableEnvName,
	TabularEnvName,
	TaskEnvName,
} from './parser.terms.js';

const listEnvNames = new Set([
	'itemize',
	'compactitem',
	'enumerate',
	'compactenum',
	'description',
	'compactdesc',
]);

const taskEnvNames = new Set(['tasks']);

const tabularEnvNames = new Set(['tabular', 'tabularx', 'longtable']);

// eslint-disable-next-line
export function specializeEnvName(name: string, stack: Stack): number {
	if (listEnvNames.has(name)) {
		return ListEnvName;
	}

	if (taskEnvNames.has(name)) {
		return TaskEnvName;
	}

	if (tabularEnvNames.has(name)) {
		return TabularEnvName;
	}

	if (name === 'table') {
		return TableEnvName;
	}

	return -1;
}

export function specializeCommandIdentifier(
	name: string,
	// eslint-disable-next-line
	stack: Stack
): number {
	if (name.startsWith('\\if')) {
		return IfCommandIdentifier;
	}

	if (name === '\\else') {
		return ElseCommandIdentifier;
	}

	if (name === '\\fi') {
		return IfEndCommandIdentifier;
	}

	if (name === '\\left' || name === '\\right') {
		return DelimiterCommandIdentifier;
	}

	return -1;
}
