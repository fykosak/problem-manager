import { syntaxTree } from '@codemirror/language';
import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { SyntaxNodeRef } from '@lezer/common';

// check correct begin and matching \end
function checkEnvironment(
	beginNode: SyntaxNodeRef,
	view: EditorView
): Diagnostic | null {
	const doc = view.state.doc;
	const cursor = syntaxTree(view.state).cursor();

	// get \begin node
	cursor.moveTo(beginNode.to, -1);

	// check for environment name argument
	if (!cursor.nextSibling() || cursor.name != 'CommandArgument') {
		return {
			from: beginNode.from,
			to: beginNode.to,
			severity: 'error',
			message:
				'\\begin environment name must be an command argument \\begin{...}',
		};
	}

	// extract the environment name
	const environmentNameArgument = doc
		.slice(cursor.from, cursor.to)
		.toString();

	// count nested environment to pick the correct \end
	let nestingDepth = 0;

	// traverse the node tree and search for an end
	while (cursor.next()) {
		if (
			// @ts-expect-error TS does not handle the change by .next()
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\begin'
		) {
			nestingDepth++;
			continue;
		}

		if (
			// @ts-expect-error TS does not handle the change by .next()
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\end'
		) {
			// if nested, go one step higher
			if (nestingDepth > 0) {
				nestingDepth--;
				continue;
			}

			if (!cursor.nextSibling()) {
				return {
					from: cursor.from,
					to: cursor.to,
					severity: 'error',
					message: '\\end missing an environment name',
				};
			}

			if (cursor.name != 'CommandArgument') {
				return {
					from: cursor.from,
					to: cursor.to,
					severity: 'error',
					message: 'environment name for \\end expected',
				};
			}

			const environmentEndNameArgument = doc
				.slice(cursor.from, cursor.to)
				.toString();
			if (environmentEndNameArgument != environmentNameArgument) {
				return {
					from: cursor.from,
					to: cursor.to,
					severity: 'error',
					message: `incorrect environment name, \\end${environmentNameArgument} expected, got \\end${environmentEndNameArgument}`,
				};
			}

			return null;
		}
	}

	return {
		from: beginNode.from,
		to: beginNode.to,
		severity: 'error',
		message: 'Matching \\end not found',
	};
}

function checkForMatchingBrace(
	beginNode: SyntaxNodeRef,
	view: EditorView,
	diagnostics: Diagnostic[],
	forwards = true
): void {
	const doc = view.state.doc;
	const cursor = syntaxTree(view.state).cursor();

	const nestingStartCharacter = forwards ? '{' : '}';
	const nestingEndCharacter = forwards ? '}' : '{';

	// get { node
	cursor.moveTo(beginNode.to, -1);

	let braceNestingDepth = 0;
	let environmentNestingDepth = 0;

	while (true) {
		if (forwards) {
			if (!cursor.next()) break;
		} else {
			if (!cursor.prev()) break;
		}

		if (cursor.name == nestingStartCharacter) {
			braceNestingDepth++;
			continue;
		}

		if (cursor.name == nestingEndCharacter && braceNestingDepth > 0) {
			braceNestingDepth--;
			continue;
		}

		if (
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\begin'
		) {
			if (forwards) {
				environmentNestingDepth++;
			} else {
				environmentNestingDepth--;
			}
		}

		if (
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\end'
		) {
			if (forwards) {
				environmentNestingDepth--;
			} else {
				environmentNestingDepth++;
			}
		}

		const closedBeforeEndMessage = 'Command closed before environment end';
		const closedAfterEndMessage = 'Command closed after environment end';

		if (cursor.name == nestingEndCharacter && braceNestingDepth == 0) {
			if (environmentNestingDepth > 0) {
				diagnostics.push({
					from: cursor.from,
					to: cursor.to,
					severity: 'error',
					message: forwards
						? closedBeforeEndMessage
						: closedAfterEndMessage,
				});
			} else if (environmentNestingDepth < 0) {
				diagnostics.push({
					from: cursor.from,
					to: cursor.to,
					severity: 'error',
					message: forwards
						? closedAfterEndMessage
						: closedBeforeEndMessage,
				});
			}
			return;
		}
	}

	diagnostics.push({
		from: beginNode.from,
		to: beginNode.to,
		severity: 'error',
		message: `Unmatched ${nestingStartCharacter}, missing ${nestingEndCharacter}`,
	});
}

export function latexLinter(view: EditorView): Diagnostic[] {
	const diagnostics: Diagnostic[] = [];

	const doc = view.state.doc;
	const tree = syntaxTree(view.state).cursor();

	tree.iterate((node) => {
		if (
			node.name == 'CommandIdentifier' &&
			doc.slice(node.from, node.to).toString() == '\\begin'
		) {
			// Find corresponding `\end`
			const environmentError = checkEnvironment(node, view);
			if (environmentError) {
				diagnostics.push(environmentError);
			}
		}

		if (node.name == '{') {
			checkForMatchingBrace(node, view, diagnostics);
		}

		if (node.name == '}') {
			checkForMatchingBrace(node, view, diagnostics, false);
		}

		if (node.name == 'Text') {
			const re = / - /;
			const text = view.state.doc.slice(node.from, node.to).toString();
			const match = re.exec(text);
			if (match != null) {
				diagnostics.push({
					from: node.from + match.index,
					to: node.from + match.index + 3, // 3 is the length of ' - '
					severity: 'error',
					message: "This is not a dash, use ' -- ' instead of ' - '",
				});
			}
		}
	});
	return diagnostics;
}
