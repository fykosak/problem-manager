import { expect, test } from 'vitest';

import { latexLanguage } from '../dist';
import { HtmlGenerator } from '../src/compiler/htmlGenerator';
import { ParserInput } from '../src/compiler/parserInput';

function parse(input: string): string {
	const parserInput = new ParserInput(input);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new HtmlGenerator(tree, parserInput);
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
	]);
});

test('unknown commands', () => {
	runTestStrings([
		{
			input: '\\withoutargument',
			output: '\\withoutargument',
		},
		{
			input: '\\unrecognized{asdf}',
			output: '\\unrecognized{asdf}',
		},
		{
			input: '\\unrecognized[arg]{asdf}',
			output: '\\unrecognized[arg]{asdf}',
		},
		{
			input: '\\unrecognized{arg}{asdf}[arg]',
			output: '\\unrecognized{arg}{asdf}[arg]',
		},
		{
			input: '\\unknown{\\unrecognized{arg}{asdf}[arg]}{second}',
			output: '\\unknown{\\unrecognized{arg}{asdf}[arg]}{second}',
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
		{ input: '\\null', output: '' },
		{ input: '\\quad', output: '' },
		{ input: '\\qquad', output: '' },
		{ input: '\\centering', output: '' },
		{ input: '\\vspace{2cm}', output: '' },
		{ input: '\\hspace{1cm}', output: '' },
		{ input: '\\vspace*{2cm}', output: '' },
		{ input: '\\hspace*{1cm}', output: '' },
	]);
});

test('inline math and commands', () => {
	runTestStrings([
		{ input: '$a$', output: '$a$' },
		{ input: 'text $math$ text', output: 'text $math$ text' },
		{ input: '$math$ text $math$', output: '$math$ text $math$' },
		{ input: '$\\(a+b\\)$', output: '$\\left(a+b\\right)$' },
		{ input: '$\\( a + b \\)$', output: '$\\left( a + b \\right)$' },
		{ input: '$\\int_a^b \\d x$', output: '$\\int_a^b \\mathrm{d} x$' },
		{ input: '$4\\dg$', output: '$4^\\circ$' },
		{ input: '$\\tg$', output: '$\\tan$' },
		{ input: '$a\\ztoho b$', output: '$a\\quad\\Rightarrow\\quad b$' },
		{
			input: '$\\eu\\Kc\\C\\micro\\ohm\\Ohm$',
			output: '$\\mathrm{e}\\textrm{Kč}^\\circ\\mskip-2mu\\mathup{C}\\upmu\\Omega\\Omega$',
		},
		{ input: '$\\f{h}{x+1}$', output: '$h\\!\\left(x+1\\right)$' },
		{ input: '$a\\_{bc}d$', output: '$a_{\\mathrm{bc}}d$' },
		{ input: '$a\\_bc$', output: '$a_{\\mathrm{b}}c$' },
		{
			input: '$a\\_\\frac{b}{c}d$',
			output: '$a_{\\mathrm{\\frac{b}{c}}}d$',
		},
	]);
});

test('eq command', () => {
	runTestStrings([
		{
			input: '\\eq{a+b}',
			output: '\\begin{equation*}a+b\\end{equation*}',
		},
		{
			input: '\\eq[m]{a+b}',
			output: '\\begin{align*}a+b\\end{align*}',
		},
		{
			input: '\\eq[a]{a+b}',
			output: '\\begin{alignat*}a+b\\end{alignat*}',
		},

		{
			input: `\\eq[m]{
	F &= G\\frac{Mm}{R^2} = ma\\,, \\\\
	a &= G\\frac{M}{R^2}\\,,
}`,
			output: `\\begin{align*}
	F &= G\\frac{Mm}{R^2} = ma\\,, \\\\
	a &= G\\frac{M}{R^2}\\,,
\\end{align*}`,
		},
	]);
});

test('comments', () => {
	runTestStrings([
		{
			input: '%comment',
			output: '',
		},
		{
			input: 'text%comment',
			output: 'text',
		},
		{
			input: `text %comment
text`,
			output: 'text \ntext',
		},
	]);
});

test('text', () => {
	runTestStrings([
		{
			input: 'a~-- b',
			output: 'a&nbsp;&ndash; b',
		},
		{
			input: 'a---b',
			output: 'a&mdash;b',
		},
		{
			input: 'Pro objekt o~hmotnosti~$m$ na povrchu měsíce',
			output: 'Pro objekt o&nbsp;hmotnosti&nbsp;$m$ na povrchu měsíce',
		},
	]);
});

test('quote macro', () => {
	runTestStrings([
		{
			input: '$"20"$',
			output: '$20$',
		},
		{
			input: '$"20,5"$',
			output: '$20{,}5$',
		},
		{
			input: '$"1 km"$',
			output: '$1\\,\\mathrm{km}$',
		},
		{
			input: '$"20 km.h^{-1}"$',
			output: '$20\\,\\mathrm{km\\cdot h^{-1}}$',
		},
		{
			input: '$"1  km"$',
			output: '$1\\,\\mathrm{km}$',
		},
		{
			input: '$"20e3"$',
			output: '$20\\cdot 10^{3}$',
		},
		{
			input: '$"20e-3"$',
			output: '$20\\cdot 10^{-3}$',
		},
		{
			input: '$"20.4e-3.2"$',
			output: '$20{,}4\\cdot 10^{-3{,}2}$',
		},
		{
			input: '$"20e3 km.s^{-1}"$',
			output: '$20\\cdot 10^{3}\\,\\mathrm{km\\cdot s^{-1}}$',
		},
		{
			input: '$"1~234 km"$',
			output: '$1\\,234\\,\\mathrm{km}$',
		},
		{
			input: '$"0.123~4 mm"$',
			output: '$0{,}123\\,4\\,\\mathrm{mm}$',
		},
	]);
});
