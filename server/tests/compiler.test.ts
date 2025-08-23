import { ParserInput, latexLanguage } from 'lang-latex';
import { describe, expect, test, vi } from 'vitest';

import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { ProblemStorage } from '@server/runner/problemStorage';

async function parse(input: string): Promise<string> {
	const parserInput = new ParserInput(input);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new HtmlGenerator(tree, parserInput, 1);
	//generator.print();
	return await generator.generateHtml();
}

async function runTestStrings(testCases: { input: string; output: string }[]) {
	for (const testCase of testCases) {
		const output = await parse(testCase.input);
		expect(output).toBe(testCase.output);
	}
}

test('paragraph', async () => {
	await runTestStrings([
		{
			input: 'asdf',
			output: '<p>asdf</p>',
		},
		{
			input: 'asdf\nqwer',
			output: '<p>asdf\nqwer</p>',
		},
		{
			input: 'asdf\n\nqwer',
			output: '<p>asdf</p><p>qwer</p>',
		},
		{
			input: 'asdf\n\n\nqwer',
			output: '<p>asdf</p><p>qwer</p>',
		},
		{
			input: `text before
\\begin{env}
asdf
\\end{env}
text after`,
			output: `<p>text before</p>\\begin{env}
asdf
\\end{env}<p>text after</p>`,
		},
	]);
});

describe('commands', () => {
	test('basic formatting', async () => {
		await runTestStrings([
			{
				input: '\\textbf{asdf}',
				output: '<p><bf>asdf</bf></p>',
			},
			{
				input: '\\textit{asdf}',
				output: '<p><i>asdf</i></p>',
			},
			{
				input: '\\emph{asdf}',
				output: '<p><em>asdf</em></p>',
			},
			{
				input: '\\uv{asdf}',
				output: '<p>„asdf“</p>',
			},
		]);
	});

	test('too many arguments', async () => {
		await runTestStrings([
			{
				input: '\\textbf{asdf}{qwer}',
				output: '<p><bf>asdf</bf>{qwer}</p>',
			},
		]);
	});

	test('unknown commands', async () => {
		await runTestStrings([
			{
				input: '\\withoutargument',
				output: '<p>\\withoutargument</p>',
			},
			{
				input: '\\unrecognized{asdf}',
				output: '<p>\\unrecognized{asdf}</p>',
			},
			{
				input: '\\unrecognized[arg]{asdf}',
				output: '<p>\\unrecognized[arg]{asdf}</p>',
			},
			{
				input: '\\unrecognized{arg}{asdf}[arg]',
				output: '<p>\\unrecognized{arg}{asdf}[arg]</p>',
			},
			{
				input: '\\unknown{\\unrecognized{arg}{asdf}[arg]}{second}',
				output: '<p>\\unknown{\\unrecognized{arg}{asdf}[arg]}{second}</p>',
			},
		]);
	});

	test('multiple arguments', async () => {
		await runTestStrings([
			{
				input: '\\taskhint{label}{hint}',
				output: '<p><em>label</em> hint</p>',
			},
			{
				input: '\\textbf{first}\\emph{middle}\\textit{last}',
				output: '<p><bf>first</bf><em>middle</em><i>last</i></p>',
			},
		]);
	});

	test('multiple commands', async () => {
		await runTestStrings([
			{
				input: '\\textbf{asdf}\\emph{asdf}',
				output: '<p><bf>asdf</bf><em>asdf</em></p>',
			},
			{
				input: '\\textbf{first}\\emph{middle}\\textit{last}',
				output: '<p><bf>first</bf><em>middle</em><i>last</i></p>',
			},
		]);
	});

	test('nested commands', async () => {
		await runTestStrings([
			{
				input: '\\textbf{before\\emph{inner}after}',
				output: '<p><bf>before<em>inner</em>after</bf></p>',
			},
			{
				input: '\\textbf{\\emph{asdf}}',
				output: '<p><bf><em>asdf</em></bf></p>',
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
});

describe('math', () => {
	test('inline math and commands', async () => {
		await runTestStrings([
			{ input: '$a$', output: '<p>$a$</p>' },
			{ input: 'text $math$ text', output: '<p>text $math$ text</p>' },
			{
				input: '$math$ text $math$',
				output: '<p>$math$ text $math$</p>',
			},
			{ input: '$\\(a+b\\)$', output: '<p>$\\left(a+b\\right)$</p>' },
			{
				input: '$\\( a + b \\)$',
				output: '<p>$\\left( a + b \\right)$</p>',
			},
			{
				input: '$\\int_a^b \\d x$',
				output: '<p>$\\int_a^b \\mathrm{d} x$</p>',
			},
			{ input: '$4\\dg$', output: '<p>$4^\\circ$</p>' },
			{ input: '$\\tg$', output: '<p>$\\tan$</p>' },
			{
				input: '$a\\ztoho b$',
				output: '<p>$a\\quad\\Rightarrow\\quad b$</p>',
			},
			{
				input: '$\\eu\\Kc\\C\\micro\\ohm\\Ohm$',
				output: '<p>$\\mathrm{e}\\textrm{Kč}^\\circ\\mskip-2mu\\mathup{C}\\upmu\\Omega\\Omega$</p>',
			},
			{
				input: '$\\frac{ab}{cd}$',
				output: '<p>$\\frac{ab}{cd}$</p>',
			},
			{
				input: '$\\f{h}{x+1}$',
				output: '<p>$h\\!\\left(x+1\\right)$</p>',
			},
			{ input: '$a\\_{bc}d$', output: '<p>$a_{\\mathrm{bc}}d$</p>' },
			{ input: '$a\\_bc$', output: '<p>$a_{\\mathrm{b}}c$</p>' },
			{
				input: '$a\\_\\frac{b}{c}d$',
				output: '<p>$a_{\\mathrm{\\frac{b}{c}}}d$</p>',
			},
		]);
	});

	test('eq command', async () => {
		await runTestStrings([
			{
				input: '\\eq{a+b}',
				output: '<p>\\begin{equation*}a+b\\end{equation*}</p>',
			},
			{
				input: '\\eq[m]{a+b}',
				output: '<p>\\begin{align*}a+b\\end{align*}</p>',
			},
			{
				input: '\\eq[a]{a+b}',
				output: '<p>\\begin{alignat*}a+b\\end{alignat*}</p>',
			},
			{
				input: `\\eq[m]{
	F &= G\\frac{Mm}{R^2} = ma\\,, \\\\
	a &= G\\frac{M}{R^2}\\,,
}`,
				output: `<p>\\begin{align*}
	F &= G\\frac{Mm}{R^2} = ma\\,, \\\\
	a &= G\\frac{M}{R^2}\\,,
\\end{align*}</p>`,
			},
		]);
	});

	test('quote macro', async () => {
		await runTestStrings([
			{
				input: '$"20"$',
				output: '<p>$20$</p>',
			},
			{
				input: '$"20,5"$',
				output: '<p>$20{,}5$</p>',
			},
			{
				input: '$"1 km"$',
				output: '<p>$1\\,\\mathrm{km}$</p>',
			},
			{
				input: '$"20 km.h^{-1}"$',
				output: '<p>$20\\,\\mathrm{km\\cdot h^{-1}}$</p>',
			},
			{
				input: '$"1  km"$',
				output: '<p>$1\\,\\mathrm{km}$</p>',
			},
			{
				input: '$"20e3"$',
				output: '<p>$20\\cdot 10^{3}$</p>',
			},
			{
				input: '$"20e-3"$',
				output: '<p>$20\\cdot 10^{-3}$</p>',
			},
			{
				input: '$"20.4e-3.2"$',
				output: '<p>$20{,}4\\cdot 10^{-3{,}2}$</p>',
			},
			{
				input: '$"20e3 km.s^{-1}"$',
				output: '<p>$20\\cdot 10^{3}\\,\\mathrm{km\\cdot s^{-1}}$</p>',
			},
			{
				input: '$"1~234 km"$',
				output: '<p>$1\\,234\\,\\mathrm{km}$</p>',
			},
			{
				input: '$"0.123~4 mm"$',
				output: '<p>$0{,}123\\,4\\,\\mathrm{mm}$</p>',
			},
			{
				input: '$\\jd{km.h^{-1}}$',
				output: '<p>$\\mathrm{km\\cdot h^{-1}}$</p>',
			},
			{
				input: '\\jd{km.h^{-1}}',
				output: '<p>$\\mathrm{km\\cdot h^{-1}}$</p>',
			},
			{
				input: '$"5\\dg"$',
				output: '<p>$5^\\circ$</p>',
			},
			{
				input: '$"\\frac{5x}{6} m.s^{-2}"$',
				output: '<p>$\\frac{5x}{6}\\,\\mathrm{m\\cdot s^{-2}}$</p>',
			},
			{
				input: '$"1/50 m"$',
				output: '<p>$1/50\\,\\mathrm{m}$</p>',
			},
		]);
	});
});

test('comments', async () => {
	await runTestStrings([
		{
			input: '%comment',
			output: '',
		},
		{
			input: 'text%comment',
			output: '<p>text</p>',
		},
		{
			input: `text %comment\ntext`,
			output: '<p>text \ntext</p>',
		},
	]);
});

test('text', async () => {
	await runTestStrings([
		{
			input: 'a~-- b',
			output: '<p>a&nbsp;&ndash; b</p>',
		},
		{
			input: 'a---b',
			output: '<p>a&mdash;b</p>',
		},
		{
			input: 'Pro objekt o~hmotnosti~$m$ na povrchu měsíce',
			output: '<p>Pro objekt o&nbsp;hmotnosti&nbsp;$m$ na povrchu měsíce</p>',
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
			input: '\\fullfig{fig}{Figures}{fig1}[width=0.2\\textwidth]',
			output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure>',
		},
		{
			input: '\\fullfig[h]{fig}{Figures}{fig1}[width=0.2\\textwidth]',
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
		{
			input: `text before
\\fullfig{fig}{Figures}{fig1}
text after`,
			output: `<p>text before</p><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Figures</figcaption></figure><p>text after</p>`,
		},
	]);
	vi.resetAllMocks();
});

describe('environment', () => {
	test('unknown environment', async () => {
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
		]);
	});

	test('list', async () => {
		await runTestStrings([
			{
				input: '\\begin{enumerate}\\item asdf\\item qwer\\end{enumerate}',
				output: '<ol><li><p>asdf</p></li><li><p>qwer</p></li></ol>',
			},
			{
				input: '\\begin{compactenum}\\item asdf\\item qwer\\end{compactenum}',
				output: '<ol><li><p>asdf</p></li><li><p>qwer</p></li></ol>',
			},
			{
				input: '\\begin{itemize}\\item asdf\\item qwer\\end{itemize}',
				output: '<ul><li><p>asdf</p></li><li><p>qwer</p></li></ul>',
			},
			{
				input: '\\begin{compactitem}\\item asdf\\item qwer\\end{compactitem}',
				output: '<ul><li><p>asdf</p></li><li><p>qwer</p></li></ul>',
			},
			{
				input: '\\begin{compactitem}[a)]\\item asdf\\item qwer\\end{compactitem}',
				output: '<ul><li><p>asdf</p></li><li><p>qwer</p></li></ul>',
			},

			// multiple paragraphs
			{
				input: `\\begin{enumerate}
\\item asdf

qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p><p>qwer</p></li></ol>',
			},

			// nested lists
			{
				input: `\\begin{enumerate}
\\item asdf
\\begin{compactenum}
\\item asdf
\\item qwer
\\end{compactenum}
\\item qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p><ol><li><p>asdf</p></li><li><p>qwer</p></li></ol></li><li><p>qwer</p></li></ol>',
			},
		]);
	});

	test('tabular', async () => {
		await runTestStrings([
			{
				input: '\\begin{tabular}{ll}\\end{tabular}',
				output: '<tbody></tbody>',
			},
			{
				input: '\\begin{tabular}{ll}sadf&asdf\\end{tabular}',
				output: '<tbody><tr><td>sadf</td><td>asdf</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{ll}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td>sadf</td><td>asdf</td></tr><tr><td>qwer</td><td>poiu</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{rlc}sadf&asdf&ldkf\\\\qwer&poiu&dnnf\\end{tabular}',
				output: '<tbody><tr><td class="text-end">sadf</td><td>asdf</td><td class="text-center">ldkf</td></tr><tr><td class="text-end">qwer</td><td>poiu</td><td class="text-center">dnnf</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{r|l}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-end text-end">sadf</td><td>asdf</td></tr><tr><td class="border-end text-end">qwer</td><td>poiu</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{|r|l|}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-start border-end text-end">sadf</td><td class="border-end">asdf</td></tr><tr><td class="border-start border-end text-end">qwer</td><td class="border-end">poiu</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{|r||l}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-start border-end text-end">sadf</td><td class="border-start">asdf</td></tr><tr><td class="border-start border-end text-end">qwer</td><td class="border-start">poiu</td></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{ll}\\toprule sadf&asdf\\\\\\midrule qwer&poiu\\\\\\bottomrule\\end{tabular}',
				output: '<tbody><tr class="table-group-divider"><td>sadf</td><td>asdf</td></tr><tr class="table-group-divider"><td>qwer</td><td>poiu</td></tr><tr class="table-group-divider"></tr></tbody>',
			},
			{
				input: '\\begin{tabular}{ll}\\toprule sadf&asdf\\\\\\hline qwer&poiu\\\\\\hline\\end{tabular}',
				output: '<tbody><tr class="table-group-divider"><td>sadf</td><td>asdf</td></tr><tr class="border-top"><td>qwer</td><td>poiu</td></tr><tr class="border-top"></tr></tbody>',
			},
		]);
	});

	test('table', async () => {
		await runTestStrings([
			{
				input: '\\begin{table}\\end{table}',
				output: '<table class="table table-sm table-borderless w-auto mx-auto"></table>',
			},
			{
				input: '\\begin{table}\\caption{Toto je caption}\\label{table}\\begin{tabular}{ll}sadf&asdf\\end{tabular}\\end{table}',
				output: '<table class="table table-sm table-borderless w-auto mx-auto"><caption>Toto je caption</caption><tbody><tr><td>sadf</td><td>asdf</td></tr></tbody></table>',
			},
		]);
	});
});
