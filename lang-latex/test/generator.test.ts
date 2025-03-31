import { expect, test } from 'vitest';

import { latexLanguage } from '../dist';
import { Generator } from '../src/compiler/generateHtml';
import { ParserInput } from '../src/compiler/parserInput';

function parse(input: string): string {
	const parserInput = new ParserInput(input);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new Generator(tree, parserInput);
	generator.print();
	return generator.generateHtml();
}

function runTestStrings(testCases: { input: string; output: string }[]) {
	for (const testCase of testCases) {
		expect(parse(testCase.input)).toBe(testCase.output);
	}
}

test('basic formatting', () => {
	runTestStrings([
		{
			input: '\\textbf{asdf}',
			output: '<bf>asdf</bf>',
		},
		{
			input: '\\textit{asdf}',
			output: '<i>asdf</i>',
		},
		{
			input: '\\emph{asdf}',
			output: '<em>asdf</em>',
		},
		{
			input: '\\uv{asdf}',
			output: '„asdf“',
		},
		{
			input: '\\withoutargument',
			output: '\\withoutargument',
		},
		{
			input: '\\unrecognized{asdf}',
			output: '\\unrecognized{asdf}',
		},
	]);
});

test('multiple arguments', () => {
	runTestStrings([
		{
			input: '\\taskhint{label}{hint}',
			output: '<em>label</em> hint',
		},
		{
			input: '\\textbf{first}\\emph{middle}\\textit{last}',
			output: '<bf>first</bf><em>middle</em><i>last</i>',
		},
	]);
});

test('multiple commands', () => {
	runTestStrings([
		{
			input: '\\textbf{asdf}\\emph{asdf}',
			output: '<bf>asdf</bf><em>asdf</em>',
		},
		{
			input: '\\textbf{first}\\emph{middle}\\textit{last}',
			output: '<bf>first</bf><em>middle</em><i>last</i>',
		},
	]);
});

test('nested commands', () => {
	runTestStrings([
		{
			input: '\\textbf{before\\emph{inner}after}',
			output: '<bf>before<em>inner</em>after</bf>',
		},
		{
			input: '\\textbf{\\emph{asdf}}',
			output: '<bf><em>asdf</em></bf>',
		},
	]);
});

test('ignored text commands', () => {
	runTestStrings([
		{
			input: '\\null',
			output: '',
		},
		{
			input: '\\quad',
			output: '',
		},
		{
			input: '\\qquad',
			output: '',
		},
		{
			input: '\\centering',
			output: '',
		},
		{
			input: '\\vspace{2cm}',
			output: '',
		},
		{
			input: '\\hspace{1cm}',
			output: '',
		},
		{
			input: '\\vspace*{2cm}',
			output: '',
		},
		{
			input: '\\hspace*{1cm}',
			output: '',
		},
	]);
});
