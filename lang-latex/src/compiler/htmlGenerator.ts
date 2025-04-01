import { Tree, TreeCursor } from '@lezer/common';

import { ParserInput } from './parserInput';

export class HtmlGenerator {
	private tree: Tree;
	private parserInput: ParserInput;
	private cursor: TreeCursor;

	constructor(tree: Tree, parserInput: ParserInput) {
		this.tree = tree;
		this.cursor = tree.cursor();
		this.parserInput = parserInput;
	}

	public print() {
		const cursor = this.tree.cursor();
		let depth = 0;
		cursor.iterate(
			() => {
				depth++;
				console.log(
					'┆   '.repeat(depth) +
						'┖' +
						cursor.name +
						': ' +
						this.parserInput.read(cursor.from, cursor.to)
				);
			},
			() => {
				depth--;
			}
		);
	}

	public generateHtml(): string {
		let html = '';

		while (this.cursor.next()) {
			console.log('generateHtml while loop: ' + this.cursor.name);
			html += this.generateNode();
		}

		return html;
	}

	private expectNext(): void {
		if (!this.cursor.next()) {
			throw new Error('Unexpected end of document');
		}
	}

	private expectNodeName(nodeName: string): void {
		if (this.cursor.name !== nodeName) {
			throw new Error(
				`Wrong token received, expected ${nodeName}, received ${this.cursor.name}`
			);
		}
	}

	/**
	 * Generate code for command argument. Cursor position ends and the last },
	 * .next() needs to be called.
	 */
	private generateCommandArgument(): string {
		const topNode = this.cursor.node;
		this.expectNodeName('CommandArgument');
		if (
			!this.cursor.node.firstChild ||
			this.cursor.node.firstChild.name !== '{'
		) {
			throw new Error('Expected {');
		}
		if (
			!this.cursor.node.lastChild ||
			this.cursor.node.lastChild.name !== '}'
		) {
			throw new Error('Expected }');
		}
		console.log(
			'argument: ' +
				this.parserInput.read(this.cursor.from, this.cursor.to)
		);
		this.cursor.firstChild();

		let buffer = '';
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			console.log(
				'argument child: ' +
					this.parserInput.read(this.cursor.from, this.cursor.to)
			);
			buffer += this.generateNode();
		}
		console.log(
			'command arg end: ' +
				this.cursor.name +
				': ' +
				this.parserInput.read(this.cursor.from, this.cursor.to)
		);

		return buffer;
	}

	private generateCommandArgumentOptional(): string {
		const topNode = this.cursor.node;
		this.expectNodeName('CommandArgumentOptional');
		if (
			!this.cursor.node.firstChild ||
			this.cursor.node.firstChild.name !== '['
		) {
			throw new Error('Expected [');
		}
		if (
			!this.cursor.node.lastChild ||
			this.cursor.node.lastChild.name !== ']'
		) {
			throw new Error('Expected ]');
		}

		this.cursor.firstChild();

		let buffer = '';
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			buffer += this.generateNode();
		}

		return buffer;
	}

	private generateCommand(): string {
		this.expectNodeName('Command');

		const topNode = this.cursor.node;
		this.cursor.firstChild();

		this.expectNodeName('CommandIdentifier');

		const commandName = this.parserInput.read(
			this.cursor.from,
			this.cursor.to
		);
		switch (commandName) {
			case '\\textbf':
				this.expectNext();
				return '<bf>' + this.generateCommandArgument() + '</bf>';
			case '\\textit':
				this.expectNext();
				return '<i>' + this.generateCommandArgument() + '</i>';
			case '\\emph':
				this.expectNext();
				return '<em>' + this.generateCommandArgument() + '</em>';
			case '\\uv':
				this.expectNext();
				return '„' + this.generateCommandArgument() + '“';
			case '\\taskhint': {
				this.expectNext();
				const firstArgument = this.generateCommandArgument();
				this.expectNext();
				const secondArgument = this.generateCommandArgument();
				return '<em>' + firstArgument + '</em> ' + secondArgument;
			}
			case '\\null':
			case '\\quad':
			case '\\qquad':
			case '\\centering':
				return ''; // ignore these commands

			case '\\vspace':
			case '\\vspace*':
			case '\\hspace':
			case '\\hspace*':
				this.expectNext();
				this.generateCommandArgument(); // consume command argument
				return ''; // ignore these commands

			// math commands
			case '\\(':
				return '\\left(';
			case '\\)':
				return '\\right)';
			case '\\d':
				return '\\mathrm{d}';
			case '\\dg':
				return '^\\circ';
			case '\\tg':
				return '\\tan';
			case '\\ztoho':
				return '\\quad\\Rightarrow\\quad';
			case '\\eu':
				return '\\mathrm{e}';
			case '\\Kc':
				return '\\textrm{Kč}';
			case '\\C':
				return '^\\circ\\mskip-2mu\\mathup{C}';
			case '\\micro':
				return '\\upmu';
			case '\\ohm':
			case '\\Ohm':
				return '\\Omega';
			case '\\f': {
				this.expectNext();
				const functionName = this.generateCommandArgument();
				this.expectNext();
				const functionParam = this.generateCommandArgument();
				return `${functionName}\\!\\left(${functionParam}\\right)`;
			}
			// TODO \jd
			default: {
				let buffer = commandName;
				// Loop over whole command and extract arguments along with the
				// command name. We can't determine, if the arguments are actually
				// argument or just groups, but it's probably an argument.
				//
				// execute next() only if the current token is not already the last one
				while (this.cursor.to < topNode.to && this.cursor.next()) {
					if (this.cursor.name === 'CommandArgument') {
						buffer += '{' + this.generateCommandArgument() + '}';
					}
					if (this.cursor.name === 'CommandArgumentOptional') {
						buffer +=
							'[' + this.generateCommandArgumentOptional() + ']';
					}
				}
				return buffer; // return command name without consuming any argument
			}
		}
	}

	private generateMath(): string {
		if (this.cursor.name !== 'Math') {
			throw new Error(`Expected Math, ${this.cursor.name} given`);
		}

		const topNode = this.cursor.node;

		let buffer = '';
		while (this.cursor.next()) {
			// TODO !!!
			buffer += this.generateNode();
			if (this.cursor.to >= topNode.to) {
				break;
			}
		}
		return buffer;
	}

	private generateInlineMath(): string {
		if (this.cursor.name !== 'InlineMath') {
			throw new Error(`Expected InlineMath, ${this.cursor.name} given`);
		}
		// consume starting $
		this.expectNext();
		this.expectNodeName('$');
		// generate Math
		this.expectNext();
		const mathContents = this.generateMath();
		// consume ending $
		this.expectNext();
		this.expectNodeName('$');

		return '$' + mathContents + '$';
	}

	private generateMathArgument(): string {
		this.expectNodeName('MathCommandArgument');
		this.expectNext(); // move to {
		this.expectNodeName('{');
		this.expectNext(); // move to Math
		const contents = this.generateMath();
		this.expectNext();
		this.expectNodeName('}');
		return contents;
	}

	private generateEqCommand(): string {
		this.expectNodeName('EqCommand');
		this.expectNext();
		this.expectNodeName('EqCommandIdentifier');
		this.expectNext();
		let eqType = '';
		if (this.cursor.name === 'CommandArgumentOptional') {
			this.expectNext();
			this.expectNodeName('[');
			this.expectNext();
			this.expectNodeName('Text');
			eqType = this.parserInput.read(this.cursor.from, this.cursor.to);
			this.expectNext();
			this.expectNodeName(']');
			this.expectNext();
		}

		const mathContents = this.generateMathArgument();

		switch (eqType) {
			case '':
				return `\\begin{equation*}${mathContents}\\end{equation*}`;
			case 'm':
				return `\\begin{align*}${mathContents}\\end{align*}`;
			case 'a':
				return `\\begin{alignat*}${mathContents}\\end{alignat*}`;
		}

		throw new Error('Unknown eq type');
	}

	private generateUnderscoreCommand(): string {
		this.expectNext();
		if (this.cursor.name === 'CommandArgument') {
			return `_{\\mathrm{${this.generateCommandArgument()}}}`;
		} else {
			return `_{\\mathrm{${this.generateNode()}}}`;
		}
	}

	private generateText(): string {
		this.expectNodeName('Text');
		return this.parserInput
			.read(this.cursor.from, this.cursor.to)
			.replace(/~/g, '&nbsp;')
			.replace(/---/g, '&mdash;')
			.replace(/--/g, '&ndash;');
	}

	private generateQuoteMacro(): string {
		this.expectNodeName('QuoteMacro');

		const topNode = this.cursor.node;

		this.expectNext();
		this.expectNodeName('"');
		this.expectNext();
		let firstPart = this.generateNode();

		this.expectNext();
		// exponent
		if (this.cursor.name === 'e') {
			this.expectNext();
			this.expectNodeName('Number');
			firstPart += `\\cdot 10^{${this.generateNode()}}`;
			this.expectNext();
		}

		console.log(firstPart);
		firstPart = firstPart
			.replace(/\./g, ',')
			.replace(/,/g, '{,}')
			.replace(/~/g, '\\,'); // TODO , -> . for en
		console.log(firstPart);

		if (this.cursor.name === '"') {
			return firstPart;
		}

		// if it did not end by quote, it must have a Whitespace
		this.expectNodeName('Whitespace');

		let secondPart = '';
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			secondPart += this.generateNode();
		}
		this.expectNodeName('"');
		secondPart = secondPart.replace('.', '\\cdot ');
		return firstPart + '\\,\\mathrm{' + secondPart + '}';
	}

	private generateNode() {
		console.log(
			'Generate node: ' +
				this.cursor.name +
				' - ' +
				this.parserInput.read(this.cursor.from, this.cursor.to)
		);

		if (this.cursor.name === 'Comment') {
			return '';
		}

		if (this.cursor.name === 'EqCommand') {
			return this.generateEqCommand();
		}

		if (this.cursor.name === 'UnderscoreCommand') {
			return this.generateUnderscoreCommand();
		}

		if (this.cursor.name === 'Command') {
			return this.generateCommand();
		}

		if (this.cursor.name === 'CommandArgument') {
			return '{' + this.generateCommandArgument() + '}';
		}

		if (this.cursor.name === 'CommandArgumentOptional') {
			return '[' + this.generateCommandArgument() + ']';
		}

		if (this.cursor.name === 'MathCommandArgument') {
			return '{' + this.generateMathArgument() + '}';
		}

		if (this.cursor.name === 'InlineMath') {
			return this.generateInlineMath();
		}

		if (this.cursor.name === 'Math') {
			return this.generateMath();
		}

		if (this.cursor.name === 'Text') {
			return this.generateText();
		}

		if (this.cursor.name === 'QuoteMacro') {
			return this.generateQuoteMacro();
		}

		if (!this.cursor.node.firstChild) {
			return this.parserInput.read(this.cursor.from, this.cursor.to);
		}

		throw new Error('Unhandled ' + this.cursor.name);
	}
}
