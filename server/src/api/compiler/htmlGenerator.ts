import { type SyntaxNode, Tree, TreeCursor } from '@lezer/common';

import { ProblemStorage } from '@server/runner/problemStorage';

import { ParserInput } from './parserInput';

export class HtmlGenerator {
	private tree: Tree;
	private parserInput: ParserInput;
	private cursor: TreeCursor;
	private problemStorage: ProblemStorage;

	constructor(tree: Tree, parserInput: ParserInput, problemId: number) {
		this.tree = tree;
		this.cursor = tree.cursor();
		this.parserInput = parserInput;
		this.problemStorage = new ProblemStorage(problemId);
	}

	private getCursorText(): string {
		return this.parserInput.read(this.cursor.from, this.cursor.to);
	}

	private checkMathMode(node: SyntaxNode): boolean {
		const cursor = node.cursor();
		do {
			if (cursor.name === 'Math') {
				return true;
			}
		} while (cursor.parent());
		return false;
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

	public async generateHtml(): Promise<string> {
		let html = '';

		while (this.cursor.next()) {
			console.log('generateHtml while loop: ' + this.cursor.name);
			html += await this.generateNode();
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
	private async generateCommandArgument(): Promise<string> {
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
		console.log('argument: ' + this.getCursorText());
		this.cursor.firstChild();

		let buffer = '';
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			console.log('argument child: ' + this.getCursorText());
			buffer += await this.generateNode();
		}
		console.log(
			'command arg end: ' + this.cursor.name + ': ' + this.getCursorText()
		);

		return buffer;
	}

	private async generateCommandArgumentOptional(): Promise<string> {
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
		// stops on last node (]) but before that it calls .next(), so it's
		// consumed
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			buffer += await this.generateNode();
		}

		return buffer;
	}

	// TODO image source from storage
	// generate html for \fullfig[position]{filename}{caption}{label}[opts]
	private async generateCommandFullfig(
		commandNode: SyntaxNode
	): Promise<string> {
		this.expectNodeName('CommandIdentifier');
		if (this.getCursorText() !== '\\fullfig') {
			throw new Error('Fullfig command expected');
		}

		this.expectNext();
		if (this.cursor.name === 'CommandArgumentOptional') {
			// just consume the first optional argument
			await this.generateCommandArgumentOptional();
			this.expectNext();
		}
		const filename = await this.generateCommandArgument();
		this.expectNext();
		const caption = await this.generateCommandArgument();
		this.expectNext();
		await this.generateCommandArgument(); // consume label

		// label was not the last argument
		if (this.cursor.to < commandNode.to) {
			this.expectNext();
			await this.generateCommandArgumentOptional(); // consume the graphics opts
		}

		const fileData = await this.problemStorage.getFileForWeb(filename);
		let buffer = '<figure class="figure w-50 text-center mx-auto d-block">';
		buffer += `<img class="figure-img img-fluid rounded w-100" src="${fileData}">`;
		if (caption !== '') {
			buffer += '<figcaption class="figure-caption text-center">';
			buffer += caption;
			buffer += '</figcaption>';
		}
		buffer += '</figure>';
		return buffer;
	}

	// \illfigi[pos]{filename}{caption}{label}{number-of-rows}{width}
	private async generateCommandIllfig(): Promise<string> {
		this.expectNodeName('CommandIdentifier');
		const commandName = this.getCursorText();
		if (commandName !== '\\illfig' && commandName !== '\\illfigi') {
			throw new Error('Illfig(i) command expected');
		}

		this.expectNext();
		if (this.cursor.name === 'CommandArgumentOptional') {
			// just consume the first optional argument
			await this.generateCommandArgumentOptional();
			this.expectNext();
		}
		const filename = await this.generateCommandArgument();
		this.expectNext();
		const caption = await this.generateCommandArgument();
		this.expectNext();
		await this.generateCommandArgument(); // consume label
		this.expectNext();
		await this.generateCommandArgument(); // consume the number of rows

		if (commandName === '\\illfigi') {
			this.expectNext();
			await this.generateCommandArgument(); // consume the width
		}

		const fileData = await this.problemStorage.getFileForWeb(filename);
		let buffer = '<figure class="figure w-25 float-end m-3">';
		buffer += `<img class="figure-img img-fluid rounded w-100" src="${fileData}">`;
		if (caption !== '') {
			buffer += '<figcaption class="figure-caption text-center">';
			buffer += caption;
			buffer += '</figcaption>';
		}
		buffer += '</figure>';
		return buffer;
	}

	private async generateCommand(): Promise<string> {
		this.expectNodeName('Command');

		const topNode = this.cursor.node;
		this.cursor.firstChild();

		this.expectNodeName('CommandIdentifier');

		const commandName = this.getCursorText();
		switch (commandName) {
			case '\\textbf':
				this.expectNext();
				return (
					'<bf>' + (await this.generateCommandArgument()) + '</bf>'
				);
			case '\\textit':
				this.expectNext();
				return '<i>' + (await this.generateCommandArgument()) + '</i>';
			case '\\emph':
				this.expectNext();
				return (
					'<em>' + (await this.generateCommandArgument()) + '</em>'
				);
			case '\\uv':
				this.expectNext();
				return '„' + (await this.generateCommandArgument()) + '“';
			case '\\taskhint': {
				this.expectNext();
				const firstArgument = await this.generateCommandArgument();
				this.expectNext();
				const secondArgument = await this.generateCommandArgument();
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
				await this.generateCommandArgument(); // consume command argument
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
				const functionName = await this.generateCommandArgument();
				this.expectNext();
				const functionParam = await this.generateCommandArgument();
				return `${functionName}\\!\\left(${functionParam}\\right)`;
			}
			case '\\jd': {
				const node = this.cursor.node;
				this.expectNext();
				const unit = (await this.generateCommandArgument()).replace(
					/\./g,
					'\\cdot '
				);
				if (!this.checkMathMode(node)) {
					return '$\\mathrm{' + unit + '}$';
				}
				return '\\mathrm{' + unit + '}';
			}
			case '\\fullfig':
				return await this.generateCommandFullfig(topNode);
			case '\\illfig':
			case '\\illfigi':
				return await this.generateCommandIllfig();
			default: {
				let buffer = commandName;
				// Loop over whole command and extract arguments along with the
				// command name. We can't determine, if the arguments are actually
				// argument or just groups, but it's probably an argument.
				//
				// execute next() only if the current token is not already the last one
				while (this.cursor.to < topNode.to && this.cursor.next()) {
					if (this.cursor.name === 'CommandArgument') {
						buffer +=
							'{' + (await this.generateCommandArgument()) + '}';
					}
					if (this.cursor.name === 'CommandArgumentOptional') {
						buffer +=
							'[' +
							(await this.generateCommandArgumentOptional()) +
							']';
					}
				}
				return buffer; // return command name without consuming any argument
			}
		}
	}

	private async generateMath(): Promise<string> {
		if (this.cursor.name !== 'Math') {
			throw new Error(`Expected Math, ${this.cursor.name} given`);
		}

		const topNode = this.cursor.node;

		let buffer = '';
		while (this.cursor.next()) {
			buffer += await this.generateNode();
			if (this.cursor.to >= topNode.to) {
				break;
			}
		}
		return buffer;
	}

	private async generateInlineMath(): Promise<string> {
		if (this.cursor.name !== 'InlineMath') {
			throw new Error(`Expected InlineMath, ${this.cursor.name} given`);
		}
		// consume starting $
		this.expectNext();
		this.expectNodeName('$');
		// generate Math
		this.expectNext();
		const mathContents = await this.generateMath();
		// consume ending $
		this.expectNext();
		this.expectNodeName('$');

		return '$' + mathContents + '$';
	}

	private async generateMathArgument(): Promise<string> {
		this.expectNodeName('MathCommandArgument');
		this.expectNext(); // move to {
		this.expectNodeName('{');
		this.expectNext(); // move to Math
		const contents = await this.generateMath();
		this.expectNext();
		this.expectNodeName('}');
		return contents;
	}

	private async generateEqCommand(): Promise<string> {
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
			eqType = this.getCursorText();
			this.expectNext();
			this.expectNodeName(']');
			this.expectNext();
		}

		const mathContents = await this.generateMathArgument();

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

	private async generateUnderscoreCommand(): Promise<string> {
		this.expectNext();
		if (this.cursor.name === 'CommandArgument') {
			return `_{\\mathrm{${await this.generateCommandArgument()}}}`;
		} else {
			return `_{\\mathrm{${await this.generateNode()}}}`;
		}
	}

	private generateText(): string {
		this.expectNodeName('Text');
		return this.getCursorText()
			.replace(/~/g, '&nbsp;')
			.replace(/---/g, '&mdash;')
			.replace(/--/g, '&ndash;');
	}

	private async generateQuoteMacro(): Promise<string> {
		this.expectNodeName('QuoteMacro');

		const topNode = this.cursor.node;

		this.expectNext();
		this.expectNodeName('"');
		this.expectNext();
		let firstPart = await this.generateNode();

		this.expectNext();
		// exponent
		if (this.cursor.name === 'e') {
			this.expectNext();
			this.expectNodeName('Number');
			firstPart += `\\cdot 10^{${await this.generateNode()}}`;
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
			secondPart += await this.generateNode();
		}
		this.expectNodeName('"');
		secondPart = secondPart.replace(/\./g, '\\cdot ');
		return firstPart + '\\,\\mathrm{' + secondPart + '}';
	}

	private async generateListItemNode(itemNode: SyntaxNode): Promise<string> {
		this.cursor = itemNode.cursor();
		this.expectNodeName('ListItem');
		const topNode = this.cursor.node;

		console.log('Generate ListNode');
		let buffer = '';
		while (this.cursor.next()) {
			console.log('next');
			buffer += await this.generateNode();
			if (this.cursor.to >= topNode.to) {
				break;
			}
		}
		return '<li>' + buffer.trim() + '</li>';
	}

	private async generateEnvironment(): Promise<string> {
		this.expectNodeName('Environment');
		const topNode = this.cursor.node;
		let buffer = '';
		while (this.cursor.next()) {
			buffer += await this.generateNode();
			if (this.cursor.to >= topNode.to) {
				break;
			}
		}
		return buffer;
	}

	private async generateBeginEnv(): Promise<string> {
		this.expectNodeName('BeginEnv');
		const topNode = this.cursor.node;
		this.expectNext();
		this.expectNodeName('BeginCommandIdentifier');
		let buffer = this.getCursorText();
		this.expectNext();
		this.expectNodeName('EnvironmentNameArgument');
		this.expectNext();
		this.expectNodeName('{');
		buffer += '{';
		this.expectNext();
		this.expectNodeName('EnvName');
		buffer += this.getCursorText();
		this.expectNext();
		this.expectNodeName('}');
		buffer += '}';
		if (this.cursor.to >= topNode.to) {
			return buffer;
		}
		while (this.cursor.next()) {
			buffer += await this.generateNode();
			if (this.cursor.to >= topNode.to) {
				break;
			}
		}
		return buffer;
	}

	private generateEndEnv(): string {
		this.expectNodeName('EndEnv');
		this.expectNext();
		this.expectNodeName('EndCommandIdentifier');
		let buffer = this.getCursorText();
		this.expectNext();
		this.expectNodeName('EnvironmentNameArgument');
		this.expectNext();
		this.expectNodeName('{');
		buffer += '{';
		this.expectNext();
		this.expectNodeName('EnvName');
		buffer += this.getCursorText();
		this.expectNext();
		this.expectNodeName('}');
		buffer += '}';
		return buffer;
	}

	private async generateListEnvironment(): Promise<string> {
		this.expectNodeName('ListEnvironment');
		const topNode = this.cursor.node;
		this.expectNext();
		this.expectNodeName('BeginEnv');
		const listEnvNameNode = this.cursor.node
			.getChild('EnvironmentNameArgument')
			?.getChild('ListEnvName');
		if (!listEnvNameNode) {
			throw new Error('List environment without name');
		}

		const envName = this.parserInput.read(
			listEnvNameNode.from,
			listEnvNameNode.to
		);

		let buffer = '';
		console.log(envName);
		if (envName === 'enumerate' || envName === 'compactenum') {
			buffer += '<ol>';
		} else {
			buffer += '<ul>';
		}

		// instead of looping over the cursor with next, just get the list items
		for (const node of topNode.getChildren('ListItem')) {
			buffer += await this.generateListItemNode(node);
		}

		this.expectNext();
		this.expectNodeName('EndEnv');
		this.cursor.moveTo(this.cursor.to, -1);

		if (envName === 'enumerate' || envName === 'compactenum') {
			buffer += '</ol>';
		} else {
			buffer += '</ul>';
		}

		console.log(buffer);

		return buffer;
	}

	private async generateNode(): Promise<string> {
		console.log(
			'Generate node: ' + this.cursor.name + ' - ' + this.getCursorText()
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
			return await this.generateCommand();
		}

		if (this.cursor.name === 'CommandArgument') {
			return '{' + (await this.generateCommandArgument()) + '}';
		}

		if (this.cursor.name === 'CommandArgumentOptional') {
			return '[' + (await this.generateCommandArgumentOptional()) + ']';
		}

		if (this.cursor.name === 'MathCommandArgument') {
			return '{' + (await this.generateMathArgument()) + '}';
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

		if (this.cursor.name === 'Environment') {
			return this.generateEnvironment();
		}

		if (this.cursor.name === 'ListEnvironment') {
			return this.generateListEnvironment();
		}

		if (this.cursor.name === 'BeginEnv') {
			return this.generateBeginEnv();
		}

		if (this.cursor.name === 'EndEnv') {
			return this.generateEndEnv();
		}

		if (!this.cursor.node.firstChild) {
			return this.getCursorText();
		}

		throw new Error('Unhandled ' + this.cursor.name);
	}
}
