import { NodeProp, type SyntaxNode, Tree, TreeCursor } from '@lezer/common';
import type { ParserInput } from 'lang-latex';

import { ProblemStorage } from '@server/runner/problemStorage';

interface Paragraph {
	type: 'env' | 'str';
	content: string;
}

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
		// this.print();
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
						`(from: ${cursor.from}; to ${cursor.to}): ` +
						this.parserInput.read(cursor.from, cursor.to).trim()
				);
			},
			() => {
				depth--;
			}
		);
	}

	public async generateHtml(): Promise<string> {
		return await this.generateContentUntil(this.cursor.to);
	}

	public async generateContentUntil(to: number): Promise<string> {
		try {
			const paragraphs: Paragraph[] = [];
			let currentParagraph = '';

			while (this.cursor.next()) {
				if (this.cursor.node.name == 'ParagraphSeparator') {
					this.breakParagraph(paragraphs, currentParagraph);
					currentParagraph = '';
				}

				const nodeGroups = this.cursor.node.type.prop(NodeProp.group);
				const isFigCommand = [
					'\\fullfig',
					'\\illfig',
					'\\illfigi',
					'\\plotfig',
					'\\taskhint',
				].some((commandName) =>
					this.getCursorText().startsWith(commandName)
				);

				if (
					(nodeGroups && nodeGroups.includes('EnvironmentGroup')) ||
					(this.cursor.name === 'Command' && isFigCommand)
				) {
					this.breakParagraph(paragraphs, currentParagraph);
					currentParagraph = '';
					paragraphs.push({
						type: 'env',
						content: await this.generateNode(),
					});
					continue;
				}

				currentParagraph += await this.generateNode();

				if (this.cursor.to >= to) {
					break;
				}
			}

			this.breakParagraph(paragraphs, currentParagraph);
			currentParagraph = '';

			let html = '';
			for (const paragraph of paragraphs) {
				if (paragraph.type == 'str') {
					html += '<p>' + paragraph.content.trim() + '</p>';
					continue;
				}
				html += paragraph.content;
			}

			return html;
		} catch (e) {
			this.print();
			throw e;
		}
	}

	private breakParagraph(paragraphs: Paragraph[], currentParagraph: string) {
		// trim before check to prevent empty paragraphs
		const formated = currentParagraph.trim();
		if (formated.length > 0) {
			paragraphs.push({
				type: 'str',
				content: formated,
			});
		}
	}

	private expectNext(): true {
		if (!this.cursor.next()) {
			throw new Error('Unexpected end of document');
		}
		return true;
	}

	private expectNodeName(nodeName: string): void {
		if (this.cursor.name !== nodeName) {
			throw new Error(
				`Wrong token received, expected ${nodeName}, received ${this.cursor.name}, from char ${this.cursor.from} to char ${this.cursor.to}`
			);
		}
	}

	private expectAnyNodeName(nodeNames: string[]): void {
		if (
			nodeNames.find((value) => value === this.cursor.name) === undefined
		) {
			throw new Error(
				`Wrong token received, received ${this.cursor.name}`
			);
		}
	}

	private async generateParagraph(): Promise<string> {
		this.expectNodeName('Paragraph');
		const topNode = this.cursor.node;
		let buffer = '<p>';
		while (this.expectNext()) {
			buffer += await this.generateNode();
			if (this.cursor.to >= topNode.to || this.cursor.name === 'EOF') {
				break;
			}
		}
		return buffer + '</p>';
	}

	/**
	 * Generate code for command argument. Cursor position ends and the last },
	 * .next() needs to be called.
	 */
	private async generateCommandArgument(): Promise<string> {
		const topNode = this.cursor.node;
		this.expectAnyNodeName(['CommandArgument', 'MathCommandArgument']);
		if (
			!this.cursor.node.firstChild ||
			this.cursor.node.firstChild.name !== '{'
		) {
			throw new Error(
				`Expected { at ${this.cursor.node.firstChild?.from}`
			);
		}
		if (
			!this.cursor.node.lastChild ||
			this.cursor.node.lastChild.name !== '}'
		) {
			throw new Error(
				`Expected } at ${this.cursor.node.lastChild?.from}`
			);
		}
		this.cursor.firstChild();

		let buffer = '';
		while (this.cursor.next() && this.cursor.to < topNode.to) {
			buffer += await this.generateNode();
		}

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

	private async generateTaskhint(): Promise<string> {
		this.expectNodeName('CommandIdentifier');

		this.expectNext();
		const hintLabel = await this.generateCommandArgument();

		this.expectNext();
		this.expectNodeName('CommandArgument');
		const argumentEnd = this.cursor.to - 1;
		this.expectNext();
		let hintContent = await this.generateContentUntil(argumentEnd);

		// remove starting <p> to be able to prepend the hintLabel
		if (hintContent.startsWith('<p>')) {
			hintContent = hintContent.replace('<p>', '');
		}
		this.expectNext();
		this.expectNodeName('}');

		return `<p><em>${hintLabel}</em> ${hintContent}`;
	}

	private async generateCommand(): Promise<string> {
		this.expectAnyNodeName(['Command', 'MathCommand']);

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
			case '\\taskhint':
				return this.generateTaskhint();
			case '\\null':
			case '\\quad':
			case '\\qquad':
			case '\\centering':
				return ''; // ignore these commands

			case '\\vspace':
			case '\\vspace*':
			case '\\hspace':
			case '\\hspace*':
			case '\\label':
				this.expectNext();
				await this.generateCommandArgument(); // consume command argument
				return ''; // ignore these commands
			case '\\caption': {
				this.expectNext();
				const caption = await this.generateCommandArgument();
				return `<caption>${caption}</caption>`;
			}

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
					if (
						this.cursor.name === 'CommandArgument' ||
						this.cursor.name === 'MathCommandArgument'
					) {
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
		this.expectNodeName('InlineMath');
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

	private async generateDisplayMath(): Promise<string> {
		this.expectNodeName('DisplayMath');
		//this.expectNext(); // move to $$
		//this.expectNodeName('$$');
		this.expectNext(); // move to Math
		const contents = await this.generateMath();
		//this.expectNext();
		//this.expectNodeName('$$');
		return contents;
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

		const parts = [
			'', // first number part
			'', // exponensial part
			'', // unit part
		];
		let currentPart = 0;

		while (this.expectNext() && this.cursor.to < topNode.to) {
			if (currentPart == 0 && this.cursor.name === 'e') {
				currentPart = 1;
				continue;
			}

			if (this.cursor.name === 'Whitespace') {
				currentPart = 2;
				continue;
			}

			parts[currentPart] += await this.generateNode();
		}

		this.expectNodeName('"');

		let numberPart = parts[0];
		if (parts[1] !== '') {
			numberPart += `\\cdot 10^{${parts[1]}}`;
		}

		numberPart = numberPart
			.replace(/\./g, ',')
			.replace(/,/g, '{,}')
			.replace(/~/g, '\\,'); // TODO , -> . for en

		if (parts[2] === '') {
			return numberPart;
		}

		const unitPart = parts[2].replace(/\./g, '\\cdot ');
		return numberPart + '\\,\\mathrm{' + unitPart + '}';
	}

	private async generateListItemNode(itemNode: SyntaxNode): Promise<string> {
		this.cursor = itemNode.cursor();
		this.expectNodeName('ListItem');
		const topNode = this.cursor.node;

		this.expectNext();
		this.expectNodeName('ItemCommand');

		// move to item command end -> skip optional argument
		this.cursor.moveTo(this.cursor.to, -1);

		return '<li>' + (await this.generateContentUntil(topNode.to)) + '</li>';
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

		return buffer;
	}

	private getColumnDefinition(tableArgument: string) {
		const columnDefinition = [];
		const defaultColDefinition = {
			startBorder: false,
			endBorder: false,
			align: 'start',
		};
		let currentColDefinition = { ...defaultColDefinition };
		for (let index = 0; index < tableArgument.length; index++) {
			if (tableArgument[index] === '|') {
				currentColDefinition.startBorder = true;
				index++;
			}
			if (index >= tableArgument.length) {
				throw new Error('Table alignment definition expected');
			}

			switch (tableArgument[index]) {
				case 'l':
					currentColDefinition.align = 'start';
					break;
				case 'c':
					currentColDefinition.align = 'center';
					break;
				case 'r':
					currentColDefinition.align = 'end';
					break;
				default:
					throw new Error('Table alignment definition expected');
			}

			index++;
			if (index < tableArgument.length) {
				if (tableArgument[index] === '|') {
					currentColDefinition.endBorder = true;
				} else {
					index--;
				}
			}

			columnDefinition.push(currentColDefinition);
			currentColDefinition = { ...defaultColDefinition };
		}

		return columnDefinition;
	}

	private async generateTabularEnvironment(): Promise<string> {
		this.expectNodeName('TabularEnvironment');
		const topNode = this.cursor.node;
		this.expectNext();
		this.expectNodeName('BeginEnv');
		this.expectNext();
		this.expectNodeName('BeginCommandIdentifier');
		this.expectNext();
		this.expectNodeName('EnvironmentNameArgument');

		// skip the env name
		this.cursor.moveTo(this.cursor.to, -1);
		this.expectNext();
		this.expectNodeName('CommandArgument'); // tabular definition

		const tableArgument = await this.generateCommandArgument();

		const columnDefinition = this.getColumnDefinition(tableArgument);

		const endNode = topNode.lastChild;
		if (!endNode || endNode.name !== 'EndEnv') {
			throw new Error('EndEnv expected');
		}

		const rows = [];
		let currentRow = [];
		const separatorRowIndexes = new Set<number>();
		const borderRowIndexes = new Set<number>();

		let buffer = '';

		// Loop until EndEnv is met, in which instance the cursor will end up
		// on the EndEnv.
		while (this.cursor.next() && this.cursor.from < endNode.from) {
			// push buffer as new cell and init next cell
			if (this.cursor.name === '&') {
				currentRow.push(buffer.trim());
				buffer = '';
				continue;
			}

			// row ended by newline, so push it and clear it
			if (this.cursor.name === 'NewlineCommand') {
				currentRow.push(buffer.trim());
				buffer = '';
				rows.push(currentRow);
				currentRow = [];
				continue;
			}

			if (this.cursor.name === 'BooktabCommand') {
				// Current row index is the same as rows length, because current
				// row is not added to the list, so the real number of lines is
				// rows.length + 1, index starts from 0, so we need to subtract 1
				// and these two cancel out.
				separatorRowIndexes.add(rows.length);
				continue;
			}

			if (this.cursor.name === 'HlineCommand') {
				borderRowIndexes.add(rows.length);
				continue;
			}

			buffer += await this.generateNode();
		}

		// last line does not need to end with a newline, so just add it if it's
		// not empty
		if (buffer.trim().length !== 0) {
			currentRow.push(buffer.trim());
		}

		if (currentRow.length !== 0) {
			rows.push(currentRow);
		}

		// consume end node
		this.expectNodeName('EndEnv');
		this.cursor.moveTo(this.cursor.to, -1);

		// reconstruct the table
		let output = '<tbody>';
		for (const [rowIndex, row] of rows.entries()) {
			if (separatorRowIndexes.has(rowIndex)) {
				output += '<tr class="table-group-divider">';
			} else if (borderRowIndexes.has(rowIndex)) {
				output += '<tr class="border-top">';
			} else {
				output += '<tr>';
			}
			for (const [cellIndex, cell] of row.entries()) {
				if (cellIndex >= columnDefinition.length) {
					throw new Error('Too many cells in a table');
				}
				const colDef = columnDefinition[cellIndex];
				const cellClasses = [];
				if (colDef.startBorder) {
					cellClasses.push('border-start');
				}
				if (colDef.endBorder) {
					cellClasses.push('border-end');
				}
				if (colDef.align === 'center') {
					cellClasses.push('text-center');
				} else if (colDef.align === 'end') {
					cellClasses.push('text-end');
				}

				if (cellClasses.length === 0) {
					output += '<td>' + cell.trim() + '</td>';
				} else {
					output += `<td class="${cellClasses.join(' ')}">${cell.trim()}</td>`;
				}
			}
			output += '</tr>';
		}

		// If bottomrule is alone on the last line, the line wont be added to
		// rows because it's empty, but to have a separator we need the extra
		// line, so just add it.
		if (separatorRowIndexes.has(rows.length)) {
			output += '<tr class="table-group-divider"></tr>';
		} else if (borderRowIndexes.has(rows.length)) {
			output += '<tr class="border-top"></tr>';
		}

		output += '</tbody>';

		return output;
	}

	private async generateTableEnvironment() {
		this.expectNodeName('TableEnvironment');

		const endNode = this.cursor.node.lastChild;
		if (!endNode || endNode.name !== 'EndEnv') {
			throw new Error('EndEnv expected');
		}

		// consume BeginEnv
		this.expectNext();
		this.expectNodeName('BeginEnv');
		this.cursor.moveTo(this.cursor.to, -1);

		let buffer =
			'<table class="table table-sm table-borderless w-auto mx-auto">';

		// Loop until EndEnv is met, in which instance the cursor will end up
		// on the EndEnv.
		while (this.cursor.next() && this.cursor.from < endNode.from) {
			buffer += await this.generateNode();
		}

		// consume end node
		this.expectNodeName('EndEnv');
		this.cursor.moveTo(this.cursor.to, -1);

		buffer += '</table>';

		return buffer;
	}

	private async generateNode(): Promise<string> {
		switch (this.cursor.name) {
			case 'Paragraph':
				return this.generateParagraph();

			case 'ParagraphSeparator':
			case 'Comment':
				return '';

			case 'EqCommand':
				return this.generateEqCommand();

			case 'UnderscoreCommand':
				return this.generateUnderscoreCommand();

			case 'Command':
			case 'MathCommand':
				return this.generateCommand();

			case 'CommandArgument':
				return '{' + (await this.generateCommandArgument()) + '}';

			case 'CommandArgumentOptional':
				return (
					'[' + (await this.generateCommandArgumentOptional()) + ']'
				);

			case 'MathCommandArgument':
				return '{' + (await this.generateMathArgument()) + '}';

			case 'InlineMath':
				return this.generateInlineMath();

			case 'DisplayMath':
				return this.generateDisplayMath();

			case 'Math':
				return this.generateMath();

			case 'Text':
				return this.generateText();

			case 'QuoteMacro':
				return this.generateQuoteMacro();

			case 'Environment':
				return this.generateEnvironment();

			case 'ListEnvironment':
				return this.generateListEnvironment();

			case 'TabularEnvironment':
				return this.generateTabularEnvironment();

			case 'TableEnvironment':
				return this.generateTableEnvironment();

			case 'BeginEnv':
				return this.generateBeginEnv();

			case 'EndEnv':
				return this.generateEndEnv();
		}

		if (!this.cursor.node.firstChild) {
			return this.getCursorText();
		}

		throw new Error(
			`Unhandled ${this.cursor.name} (from: ${this.cursor.from}; to ${this.cursor.to}): `
		);
	}
}
