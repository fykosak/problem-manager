import { ParserInput, latexLanguage } from 'lang-latex';
import { describe, expect, test, vi } from 'vitest';

import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { ProblemStorage } from '@server/runner/problemStorage';

async function parse(input: string): Promise<string> {
	const parserInput = new ParserInput(input);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new HtmlGenerator(tree, parserInput, 1);
	return await generator.generateHtml();
}

function runTestStrings(
	testCases: { name?: string; input: string; output: string }[]
) {
	for (const testCase of testCases) {
		test(
			testCase.name ?? testCase.input.replace(/\n/g, '\\n'),
			async () => {
				const output = await parse(testCase.input);
				expect(output).toBe(testCase.output);
			}
		);
	}
}

describe('nothing', () => {
	runTestStrings([{ input: '', output: '' }]);
});

describe('paragraph', () => {
	runTestStrings([
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
			name: 'ended by env',
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
	describe('basic formatting', () => {
		runTestStrings([
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
			{
				input: '\\mbox{asdf}',
				output: '<p>asdf</p>',
			},
		]);
	});

	describe('too many arguments', () => {
		runTestStrings([
			{
				input: '\\textbf{asdf}{qwer}',
				output: '<p><bf>asdf</bf>qwer</p>',
			},
		]);
	});

	describe('unknown commands', () => {
		runTestStrings([
			{
				input: '\\withoutargument',
				output: '<p>\\withoutargument</p>',
			},
			{
				input: '\\emptyargument{}',
				output: '<p>\\emptyargument{}</p>',
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

	describe('multiple arguments', () => {
		runTestStrings([
			{
				input: '\\textbf{first}\\emph{middle}\\textit{last}',
				output: '<p><bf>first</bf><em>middle</em><i>last</i></p>',
			},
		]);
	});

	describe('multiple commands', () => {
		runTestStrings([
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

	describe('nested commands', () => {
		runTestStrings([
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

	describe('ignored text commands', () => {
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

	describe('taskhint', () => {
		runTestStrings([
			{
				input: '\\taskhint{label}{hint}',
				output: '<p><em>label</em> hint</p>',
			},
			{
				input: `\\taskhint{hint}{
asdf

qwer
}`,
				output: '<p><em>hint</em> asdf</p><p>qwer</p>',
			},
		]);
	});

	describe('single char commands', () => {
		runTestStrings([
			{
				input: '\\#',
				output: '<p>#</p>',
			},
			{
				input: '\\_',
				output: '<p>_</p>',
			},
			{
				input: 'kra\\-ko\\-noš',
				output: '<p>krakonoš</p>',
			},
		]);
	});
});

describe('math', () => {
	describe('inline math and commands', () => {
		runTestStrings([
			{
				input: '$a$',
				output: '<p>$a$</p>',
			},
			{
				name: 'empty math argument',
				input: '${}$',
				output: '<p>${}$</p>',
			},
			{
				input: 'text $math$ text',
				output: '<p>text $math$ text</p>',
			},
			{
				input: '$math$ text $math$',
				output: '<p>$math$ text $math$</p>',
			},
			{
				input: '$\\(a+b\\)$',
				output: '<p>$\\left(a+b\\right)$</p>',
			},
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

	describe('eq command', () => {
		runTestStrings([
			{
				name: 'basic',
				input: '\\eq{a+b}',
				output: '<p>\\begin{equation*}a+b\\end{equation*}</p>',
			},
			{
				name: 'align',
				input: '\\eq[m]{a+b}',
				output: '<p>\\begin{align*}a+b\\end{align*}</p>',
			},
			{
				name: 'alignat',
				input: '\\eq[a]{a+b}',
				output: '<p>\\begin{alignat*}a+b\\end{alignat*}</p>',
			},
			{
				name: 'multiline',
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

	describe('quote macro', () => {
		runTestStrings([
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
				output: '<p>$20\\,\\mathrm{km\\!\\cdot\\! h^{-1}}$</p>',
			},
			{
				input: '$"1  km"$',
				output: '<p>$1\\,\\mathrm{km}$</p>',
			},
			{
				input: '$1" km"$',
				output: '<p>$1\\,\\mathrm{km}$</p>',
			},
			{
				input: '$"20e3"$',
				output: '<p>$20\\cdot 10^{3}$</p>',
			},
			{
				input: '$"20e{-3}"$',
				output: '<p>$20\\cdot 10^{-3}$</p>',
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
				output: '<p>$20\\cdot 10^{3}\\,\\mathrm{km\\!\\cdot\\! s^{-1}}$</p>',
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
				input: '$"1\\,500 mAh"$',
				output: '<p>$1\\,500\\,\\mathrm{mAh}$</p>',
			},
			{
				input: '$\\jd{km.h^{-1}}$',
				output: '<p>$\\mathrm{km\\!\\cdot\\! h^{-1}}$</p>',
			},
			{
				input: '\\jd{km.h^{-1}}',
				output: '<p>$\\mathrm{km\\!\\cdot\\! h^{-1}}$</p>',
			},
			{
				input: '$"5\\dg"$',
				output: '<p>$5^\\circ$</p>',
			},
			{
				input: '$"\\frac{5x}{6} m.s^{-2}"$',
				output: '<p>$\\frac{5x}{6}\\,\\mathrm{m\\!\\cdot\\! s^{-2}}$</p>',
			},
			{
				input: '$"1/50 m"$',
				output: '<p>$1/50\\,\\mathrm{m}$</p>',
			},
			{
				input: '$"10^{-12} W.m^{-2}"$',
				output: '<p>$10^{-12}\\,\\mathrm{W\\!\\cdot\\! m^{-2}}$</p>',
			},
			{
				input: '$"10^{-12}\n\t  W.m^{-2}"$',
				output: '<p>$10^{-12}\\,\\mathrm{W\\!\\cdot\\! m^{-2}}$</p>',
			},
			{
				input: '$"700 \\micro{}F"$',
				output: '<p>$700\\,\\mathrm{\\upmu{}F}$</p>',
			},
		]);
	});

	describe('ensure math', () => {
		runTestStrings([
			{
				input: '\\ce{C-C}',
				output: '<p>$\\ce{C-C}$</p>',
			},
			{
				input: '$\\ce{C-C}$',
				output: '<p>$\\ce{C-C}$</p>',
			},
			{
				input: '\\bod{A}',
				output: '<p>$\\mathit{A}$</p>',
			},
			{
				input: '$\\bod{A}$',
				output: '<p>$\\mathit{A}$</p>',
			},
		]);
	});
});

describe('comments', () => {
	runTestStrings([
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
		{
			input: `\\eq{%comment\nmath\n}text`,
			output: '<p>\\begin{equation*}\nmath\n\\end{equation*}text</p>',
		},
	]);
});

describe('text', () => {
	runTestStrings([
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

describe('figures', () => {
	vi.spyOn(ProblemStorage.prototype, 'getFileForWeb').mockImplementation(
		// eslint-disable-next-line
		async (filename: string) => {
			return filename;
		}
	);

	describe('figures', () => {
		runTestStrings([
			{
				input: '\\fullfig{fig}{}{}',
				output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"></figure>',
			},
			{
				input: '\\fullfig{fig}{Figures}{fig1}[width=0.2\\textwidth]',
				output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: '\\fullfig[h]{fig}{Figures}{fig1}[width=0.2\\textwidth]',
				output: '<figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: '\\illfig{fig}{Figures}{fig1}{}',
				output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: '\\illfig[O]{fig}{Figures}{fig1}{5}',
				output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: '\\illfigi{fig}{Figures}{fig1}{}{0.15}',
				output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: '\\illfigi[o]{fig}{Figures}{fig1}{}{0.15}',
				output: '<figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				input: `text before
\\fullfig{fig}{Figures}{fig1}
text after`,
				output: `<p>text before</p><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure><p>text after</p>`,
			},
		]);
	});

	describe('refs', () => {
		runTestStrings([
			{
				name: 'lbl',
				input: '\\eq{a\\lbl{ref1}}',
				output: '<p>\\begin{equation*}a\\tag{1}\\label{ref1}\\end{equation*}</p>',
			},
			{
				name: 'eqref',
				input: '\\eqref{ref1}\\eq{a\\lbl{ref1}}',
				output: '<p>\\eqref{ref1}\\begin{equation*}a\\tag{1}\\label{ref1}\\end{equation*}</p>',
			},
			{
				name: 'ref lbl',
				input: 'eq \\ref{ref1}\\eq{a\\lbl{ref1}}',
				output: '<p>eq 1\\begin{equation*}a\\tag{1}\\label{ref1}\\end{equation*}</p>',
			},
			{
				name: 'multi lbl ref',
				input: 'eq \\ref{ref2}\\eq{a\\lbl{ref1}\\\\b\\lbl{ref2}}',
				output: '<p>eq 2\\begin{equation*}a\\tag{1}\\label{ref1}\\\\b\\tag{2}\\label{ref2}\\end{equation*}</p>',
			},
			{
				name: 'multi lbl',
				input: '\\eq[m]{a\\lbl{ref1}\\\\b\\lbl{ref2}}\\eq{c\\lbl{ref3}}',
				output: '<p>\\begin{align*}a\\tag{1}\\label{ref1}\\\\b\\tag{2}\\label{ref2}\\end{align*}\\begin{equation*}c\\tag{3}\\label{ref3}\\end{equation*}</p>',
			},
			{
				name: 'fullfig ref',
				input: 'text \\ref{fig1}\\fullfig{fig}{Figures}{fig1}',
				output: '<p>text 1</p><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				name: 'illfig ref',
				input: 'text \\ref{fig1}\\illfig{fig}{Figures}{fig1}{}',
				output: '<p>text 1</p><figure class="figure w-25 float-end m-3"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
			{
				name: 'multiple fullfig refs',
				input: 'text \\ref{fig1} and text \\ref{fig2}\\fullfig{fig}{Figures}{fig1}\\fullfig{fig}{Figures}{fig2}',
				output: '<p>text 1 and text 2</p><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 2: Figures</figcaption></figure>',
			},
			{
				name: 'multiple fullfig refs',
				input: 'text \\ref{fig2}\\fullfig{fig}{Figures}{}\\fullfig{fig}{Figures}{fig2}',
				output: '<p>text 2</p><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 2: Figures</figcaption></figure>',
			},
			{
				name: 'table ref',
				input: 'text \\ref{table1}\\begin{table}\\caption{caption}\\label{table1}\\end{table}',
				output: '<p>text 1</p><table class="table table-sm table-borderless w-auto mx-auto"><caption>Tabulka 1: caption</caption></table>',
			},
			{
				name: 'multi table ref',
				input: 'text \\ref{table2}\\begin{table}\\caption{caption 1}\\label{table1}\\end{table}\\begin{table}\\caption{caption 2}\\label{table2}\\end{table}',
				output: '<p>text 2</p><table class="table table-sm table-borderless w-auto mx-auto"><caption>Tabulka 1: caption 1</caption></table><table class="table table-sm table-borderless w-auto mx-auto"><caption>Tabulka 2: caption 2</caption></table>',
			},
			{
				name: 'table & fullfig ref',
				input: 'table \\ref{table1} fig \\ref{fig1}\\begin{table}\\caption{caption}\\label{table1}\\end{table}\\fullfig{fig}{Figures}{fig1}',
				output: '<p>table 1 fig 1</p><table class="table table-sm table-borderless w-auto mx-auto"><caption>Tabulka 1: caption</caption></table><figure class="figure w-50 text-center mx-auto d-block"><img class="figure-img img-fluid rounded w-100" src="fig"><figcaption class="figure-caption text-center">Obrázek 1: Figures</figcaption></figure>',
			},
		]);
	});
});

describe('environment', () => {
	describe('unknown environment', () => {
		runTestStrings([
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

	describe('inside command', () => {
		runTestStrings([
			{
				input: '\\parbox{5cm}{\\begin{unknown}\\asdf\\end{unknown}}',
				output: '<p>\\parbox{5cm}{\\begin{unknown}\\asdf\\end{unknown}}</p>',
			},
		]);
	});

	describe('list', () => {
		runTestStrings([
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

			{
				name: 'multiple paragraphs',
				input: `\\begin{enumerate}
\\item asdf

qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p><p>qwer</p></li></ol>',
			},

			{
				name: 'nested lists',
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

			{
				name: 'indentation',
				input: `\\begin{enumerate}
	\\item asdf
	\\item qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p></li><li><p>qwer</p></li></ol>',
			},

			// TODO starting value is ignored
			{
				name: 'setcounter command',
				input: `\\begin{enumerate}
	\\setcounter{enumi}{2}
	\\item asdf
	\\item qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p></li><li><p>qwer</p></li></ol>',
			},
			{
				name: 'if before item',
				input: `\\begin{enumerate}
	\\ifyearbook\\setcounter{enumi}{2}\\fi
	\\item asdf
	\\item qwer
\\end{enumerate}`,
				output: '<ol><li><p>asdf</p></li><li><p>qwer</p></li></ol>',
			},

			// TODO label is ignored
			{
				name: 'item label',
				input: `\\begin{enumerate}\\item[asdf] qwer\\end{enumerate}`,
				output: '<ol><li><p>qwer</p></li></ol>',
			},
			{
				input: `\\begin{enumerate}\\item asdf{} qwer\\end{enumerate}`,
				output: '<ol><li><p>asdf qwer</p></li></ol>',
			},
		]);
	});

	describe('tabular', () => {
		runTestStrings([
			{
				name: 'empty',
				input: '\\begin{tabular}{ll}\\end{tabular}',
				output: '<tbody></tbody>',
			},
			{
				name: 'basic content',
				input: '\\begin{tabular}{ll}sadf&asdf\\end{tabular}',
				output: '<tbody><tr><td>sadf</td><td>asdf</td></tr></tbody>',
			},
			{
				name: 'multiple lines',
				input: '\\begin{tabular}{ll}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td>sadf</td><td>asdf</td></tr><tr><td>qwer</td><td>poiu</td></tr></tbody>',
			},
			{
				name: 'different column alignment',
				input: '\\begin{tabular}{rlc}sadf&asdf&ldkf\\\\qwer&poiu&dnnf\\end{tabular}',
				output: '<tbody><tr><td class="text-end">sadf</td><td>asdf</td><td class="text-center">ldkf</td></tr><tr><td class="text-end">qwer</td><td>poiu</td><td class="text-center">dnnf</td></tr></tbody>',
			},
			{
				name: 'column border',
				input: '\\begin{tabular}{r|l}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-end text-end">sadf</td><td>asdf</td></tr><tr><td class="border-end text-end">qwer</td><td>poiu</td></tr></tbody>',
			},
			{
				name: 'outside border',
				input: '\\begin{tabular}{|r|l|}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-start border-end text-end">sadf</td><td class="border-end">asdf</td></tr><tr><td class="border-start border-end text-end">qwer</td><td class="border-end">poiu</td></tr></tbody>',
			},
			{
				name: 'double border',
				input: '\\begin{tabular}{|r||l}sadf&asdf\\\\qwer&poiu\\end{tabular}',
				output: '<tbody><tr><td class="border-start border-end text-end">sadf</td><td class="border-start">asdf</td></tr><tr><td class="border-start border-end text-end">qwer</td><td class="border-start">poiu</td></tr></tbody>',
			},
			{
				name: 'p column',
				input: '\\begin{tabular}{p{2cm}p{3cm}}sadf&asdf\\end{tabular}',
				output: '<tbody><tr><td>sadf</td><td>asdf</td></tr></tbody>',
			},
			{
				name: 'booktabs',
				input: '\\begin{tabular}{ll}\\toprule sadf&asdf\\\\\\midrule qwer&poiu\\\\\\bottomrule\\end{tabular}',
				output: '<tbody><tr class="table-group-divider"><td>sadf</td><td>asdf</td></tr><tr class="table-group-divider"><td>qwer</td><td>poiu</td></tr><tr class="table-group-divider"></tr></tbody>',
			},
			{
				name: 'hline',
				input: '\\begin{tabular}{ll}\\hline sadf&asdf\\\\\\hline qwer&poiu\\\\\\hline\\end{tabular}',
				output: '<tbody><tr class="border-top"><td>sadf</td><td>asdf</td></tr><tr class="border-top"><td>qwer</td><td>poiu</td></tr><tr class="border-top"></tr></tbody>',
			},
			{
				name: 'square brackets in content',
				input: '\\begin{tabular}{ll}a [b]&c [d]\\end{tabular}',
				output: '<tbody><tr><td>a [b]</td><td>c [d]</td></tr></tbody>',
			},
		]);
	});

	describe('table', () => {
		runTestStrings([
			{
				name: 'empty table',
				input: '\\begin{table}\\end{table}',
				output: '<table class="table table-sm table-borderless w-auto mx-auto"></table>',
			},
			{
				name: 'captioned table',
				input: '\\begin{table}\\caption{Toto je caption}\\label{table}\\begin{tabular}{ll}sadf&asdf\\end{tabular}\\end{table}',
				output: '<table class="table table-sm table-borderless w-auto mx-auto"><caption>Tabulka 1: Toto je caption</caption><tbody><tr><td>sadf</td><td>asdf</td></tr></tbody></table>',
			},
		]);
	});

	describe('math environment', () => {
		runTestStrings([
			{
				name: 'empty pmatrix',
				input: `$\\begin{pmatrix}\\end{pmatrix}$`,
				output: '<p>$\\begin{pmatrix}\\end{pmatrix}$</p>',
			},
			{
				name: 'pmatrix with content',
				input: `\\eq{\\begin{pmatrix} 0 & 1\\\\ 2 & 3\\end{pmatrix}}`,
				output: '<p>\\begin{equation*}\\begin{pmatrix} 0 & 1\\\\ 2 & 3\\end{pmatrix}\\end{equation*}</p>',
			},
		]);
	});
});

describe('footnote', () => {
	runTestStrings([
		{
			input: 'text\\footnote{footnote}',
			output: '<p>text<sup>1</sup></p><hr><ol><li><p>footnote</p></li></ol>',
		},
		{
			input: 'text\\footnote{footnote}text\\footnote{footnote2}',
			output: '<p>text<sup>1</sup>text<sup>2</sup></p><hr><ol><li><p>footnote</p></li><li><p>footnote2</p></li></ol>',
		},
		{
			input: 'text\\footnotei{,}{footnote}',
			output: '<p>text,<sup>1</sup></p><hr><ol><li><p>footnote</p></li></ol>',
		},
		{
			input: `text\\footnote{par1

	par2
}`,
			output: '<p>text<sup>1</sup></p><hr><ol><li><p>par1</p><p>par2</p></li></ol>',
		},
	]);
});

describe('url', () => {
	runTestStrings([
		{
			input: '\\url{https://example.com}',
			output: '<p><a href="https://example.com">https://example.com</a></p>',
		},
		{
			input: '\\url{https://example.com/url\\_underscore}',
			output: '<p><a href="https://example.com/url_underscore">https://example.com/url_underscore</a></p>',
		},
		{
			input: '\\url{https://example.com/url\\#hashtag}',
			output: '<p><a href="https://example.com/url#hashtag">https://example.com/url#hashtag</a></p>',
		},
		{
			input: '\\url{https://example.com/url?key=value}',
			output: '<p><a href="https://example.com/url?key=value">https://example.com/url?key=value</a></p>',
		},
	]);
});

describe('ifs', () => {
	runTestStrings([
		{
			input: '\\ifyearbook asdf\\fi',
			output: '',
		},
		{
			input: '\\ifyearbook\\else qwer\\fi',
			output: '<p>qwer</p>',
		},
		{
			input: '\\ifyearbook asdf\\else qwer\\fi',
			output: '<p>qwer</p>',
		},
		{
			input: '\\iftask asdf\\fi',
			output: '<p>asdf</p>',
		},
		{
			input: '\\iftask{asdf}\\fi text',
			output: '<p>asdf text</p>',
		},
	]);
});
