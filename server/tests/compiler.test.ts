import { ParserInput, latexLanguage } from 'lang-latex';
import { expect, test, vi } from 'vitest';

import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { ProblemStorage } from '@server/runner/problemStorage';

async function parse(input: string): Promise<string> {
	const parserInput = new ParserInput(input);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new HtmlGenerator(tree, parserInput, 1);
	generator.print();
	return await generator.generateHtml();
}

async function runTestStrings(testCases: { input: string; output: string }[]) {
	for (const testCase of testCases) {
		const output = await parse(testCase.input);
		expect(output).toBe(testCase.output);
	}
}

test('basic formatting', async () => {
	await runTestStrings([
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

test('unknown commands', async () => {
	await runTestStrings([
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

test('multiple arguments', async () => {
	await runTestStrings([
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

test('multiple commands', async () => {
	await runTestStrings([
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

test('nested commands', async () => {
	await runTestStrings([
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

test('ignored text commands', async () => {
	await runTestStrings([
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

test('inline math and commands', async () => {
	await runTestStrings([
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

test('eq command', async () => {
	await runTestStrings([
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

test('comments', async () => {
	await runTestStrings([
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

test('text', async () => {
	await runTestStrings([
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

test('quote macro', async () => {
	await runTestStrings([
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
		{
			input: '$\\jd{km.h^{-1}}$',
			output: '$\\mathrm{km\\cdot h^{-1}}$',
		},
		{
			input: '\\jd{km.h^{-1}}',
			output: '$\\mathrm{km\\cdot h^{-1}}$',
		},
	]);
});

test('figures', async () => {
	vi.spyOn(ProblemStorage.prototype, 'getFileForWeb').mockImplementation(
		// eslint-disable-next-line
		async (filename: string) => {
			return filename;
		}
	);
	await runTestStrings([
		{
			input: '\\fullfig{fig}{Figures}{fig1}[width=0.2\textwidth]',
			output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\fullfig[h]{fig}{Figures}{fig1}[width=0.2\textwidth]',
			output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\illfig{fig}{Figures}{fig1}{}',
			output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\illfig[O]{fig}{Figures}{fig1}{5}',
			output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\illfigi{fig}{Figures}{fig1}{}{0.15}',
			output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\illfigi[o]{fig}{Figures}{fig1}{}{0.15}',
			output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
	]);
	vi.resetAllMocks();
});

test('environment', async () => {
	await runTestStrings([
		{
			input: '\\begin{unknown}\\asdf\\end{unknown}',
			output: '\\begin{unknown}\\asdf\\end{unknown}',
		},
		{
			input: '\\begin{unknown}\\textbf{text}\\end{unknown}',
			output: '\\begin{unknown}<bf>text</bf>\\end{unknown}',
		},
		{
			input: '\\begin{unknown}[arg]{arg}asdf\\end{unknown}',
			output: '\\begin{unknown}[arg]{arg}asdf\\end{unknown}',
		},
		{
			input: '\\begin{enumerate}\\item asdf\\item qwer\\end{enumerate}',
			output: '<ol><li>asdf</li><li>qwer</li></ol>',
		},
		{
			input: '\\begin{compactenum}\\item asdf\\item qwer\\end{compactenum}',
			output: '<ol><li>asdf</li><li>qwer</li></ol>',
		},
		{
			input: '\\begin{itemize}\\item asdf\\item qwer\\end{itemize}',
			output: '<ul><li>asdf</li><li>qwer</li></ul>',
		},
		{
			input: '\\begin{compactitem}\\item asdf\\item qwer\\end{compactitem}',
			output: '<ul><li>asdf</li><li>qwer</li></ul>',
		},
	]);
});
