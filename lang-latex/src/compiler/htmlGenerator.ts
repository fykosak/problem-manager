import { Tree, TreeCursor } from '@lezer/common';

import { ParserInput } from './parserInput';

export class HtmlGenerator {
	private tree: Tree;
	private parserInput: ParserInput;

	constructor(tree: Tree, parserInput: ParserInput) {
		this.tree = tree;
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

	public generateHtml() {
		const cursor = this.tree.cursor();
		let html = '';

		while (cursor.next()) {
			console.log('generateHtml while loop: ' + cursor.name);
			html += this.generateNode(cursor);
		}

		return html;
	}

	private expectNext(cursor: TreeCursor) {
		if (!cursor.next()) {
			throw new Error('Unexpected end of document');
		}
	}

	/**
	 * Generate code for command argument. Cursor position ends and the last },
	 * .next() needs to be called.
	 */
	private generateCommandArgument(cursor: TreeCursor) {
		const topNode = cursor.node;
		if (cursor.node.name !== 'CommandArgument') {
			throw new Error(
				`Expected CommandArgument, ${this.parserInput.read(cursor.from, cursor.to)} given`
			);
		}
		if (!cursor.node.firstChild || cursor.node.firstChild.name !== '{') {
			throw new Error('Expected {');
		}
		if (!cursor.node.lastChild || cursor.node.lastChild.name !== '}') {
			throw new Error('Expected }');
		}
		console.log(
			'argument: ' + this.parserInput.read(cursor.from, cursor.to)
		);
		cursor.firstChild();

		let buffer = '';
		while (cursor.next() && cursor.to < topNode.to) {
			console.log(
				'argument child: ' +
					this.parserInput.read(cursor.from, cursor.to)
			);
			buffer += this.generateNode(cursor);
		}
		console.log(
			'command arg end: ' +
				cursor.name +
				': ' +
				this.parserInput.read(cursor.from, cursor.to)
		);

		return buffer;
	}

	private generateCommand(cursor: TreeCursor) {
		if (cursor.name !== 'Command') {
			throw new Error('Expected Command');
		}

		cursor.firstChild();

		// @ts-expect-error TS does not handle the change by .next()
		if (cursor.name !== 'CommandIdentifier') {
			throw new Error('Expected CommandIdentifier');
		}

		const commandName = this.parserInput.read(cursor.from, cursor.to);
		switch (commandName) {
			case '\\textbf':
				this.expectNext(cursor);
				return '<bf>' + this.generateCommandArgument(cursor) + '</bf>';
			case '\\textit':
				this.expectNext(cursor);
				return '<i>' + this.generateCommandArgument(cursor) + '</i>';
			case '\\emph':
				this.expectNext(cursor);
				return '<em>' + this.generateCommandArgument(cursor) + '</em>';
			case '\\uv':
				this.expectNext(cursor);
				return '„' + this.generateCommandArgument(cursor) + '“';
			case '\\taskhint':
				this.expectNext(cursor);
				const firstArgument = this.generateCommandArgument(cursor);
				this.expectNext(cursor);
				const secondArgument = this.generateCommandArgument(cursor);
				return '<em>' + firstArgument + '</em> ' + secondArgument;

			case '\\null':
			case '\\quad':
			case '\\qquad':
			case '\\centering':
				return ''; // ignore these commands

			case '\\vspace':
			case '\\vspace*':
			case '\\hspace':
			case '\\hspace*':
				this.expectNext(cursor);
				this.generateCommandArgument(cursor); // consume command argument
				return ''; // ignore these commands

			default:
				return commandName; // return command name without consuming any argument
		}
	}

	private generateNode(cursor: TreeCursor) {
		console.log(
			'Generate node: ' +
				cursor.name +
				' - ' +
				this.parserInput.read(cursor.from, cursor.to)
		);

		if (cursor.name === 'Command') {
			return this.generateCommand(cursor);
		}

		if (cursor.name === 'CommandArgument') {
			return '{' + this.generateCommandArgument(cursor) + '}';
		}

		if (!cursor.node.firstChild) {
			return this.parserInput.read(cursor.from, cursor.to);
		}

		throw new Error('Unhandled ' + cursor.name);
	}
}
