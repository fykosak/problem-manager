import { closeBrackets, insertBracket } from '@codemirror/autocomplete';
import { EditorSelection, EditorState } from '@codemirror/state';
import { describe, expect, test } from 'vitest';

import { latex } from '../dist/index.js';
import { isEscaped } from '../src/input';

function typeBracket(state: EditorState, bracket: string) {
	const transaction = insertBracket(state, bracket);
	if (!transaction) {
		throw new Error(
			`Expected ${bracket} to be handled as a paired character`
		);
	}
	return state.update(transaction).state;
}

describe('LaTeX paired characters', () => {
	test('recognizes escaped dollar sign positions', () => {
		expect(isEscaped('\\')).toBe(true);
		expect(isEscaped('text \\')).toBe(true);
		expect(isEscaped('\\\\')).toBe(false);
		expect(isEscaped('text')).toBe(false);
	});

	test('pairs dollar signs and places the cursor between them', () => {
		const state = EditorState.create({
			extensions: [latex(), closeBrackets()],
		});

		const result = typeBracket(state, '$');

		expect(result.doc.toString()).toBe('$$');
		expect(result.selection.main.head).toBe(1);
	});

	test('moves over the generated closing dollar sign', () => {
		const state = EditorState.create({
			extensions: [latex(), closeBrackets()],
		});
		const paired = typeBracket(state, '$');

		const result = typeBracket(paired, '$');

		expect(result.doc.toString()).toBe('$$');
		expect(result.selection.main.head).toBe(2);
	});

	test('wraps selected text in dollar signs', () => {
		const state = EditorState.create({
			doc: 'x + y',
			selection: EditorSelection.range(0, 5),
			extensions: [latex(), closeBrackets()],
		});

		const result = typeBracket(state, '$');

		expect(result.doc.toString()).toBe('$x + y$');
		expect(result.selection.main.from).toBe(1);
		expect(result.selection.main.to).toBe(6);
	});
});
