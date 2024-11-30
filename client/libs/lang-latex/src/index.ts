import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent, syntaxTree } from "@codemirror/language"
import { completeFromList } from "@codemirror/autocomplete"
import { styleTags, tags as t } from "@lezer/highlight"
import { Diagnostic } from "@codemirror/lint"
import { SyntaxNodeRef } from "@lezer/common"
import { EditorView } from "@codemirror/view"

export const latexLanguage = LRLanguage.define({
	name: 'latex',
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				CommandArgument: delimitedIndent({ closing: "}", align: false })
			}),
			foldNodeProp.add({
				InlineMath: foldInside,
				CommandArgument: foldInside
			}),
			styleTags({
				InlineMathContent: t.string,
				CommandIdentifier: t.keyword,
				"$": t.separator,
				"( )": t.paren,
				"[ ]": t.squareBracket,
				"{ }": t.brace,
				Comment: t.comment
			})
		]
	}),
	languageData: {
		commentTokens: { line: "%" }
	}
})

const latexCompletion = latexLanguage.data.of({
	autocomplete: completeFromList([
		{ label: "\\frac{}{}", type: "keyword" }
	]),
});

// check correct begin and matching \end
function checkEnvironment(beginNode: SyntaxNodeRef, view: EditorView): Diagnostic | null {
	const doc = view.state.doc;
	const cursor = syntaxTree(view.state).cursor();

	// get \begin node
	cursor.moveTo(beginNode.to);
	cursor.next();

	// check for environment name argument
	// TODO automatically goes to the command argument check
	if (!cursor.nextSibling()) {
		return {
			from: beginNode.from,
			to: beginNode.to,
			severity: "error",
			message: "\\begin is missing an environment name"
		}
	}

	if (cursor.name != "CommandArgument") {
		return {
			from: beginNode.from,
			to: beginNode.to,
			severity: "error",
			message: "\\begin environment name must be an command argument \\begin{...}"
		}
	}

	// extract the environment name
	const environmentNameArgument = doc.slice(cursor.from, cursor.to).toString();

	// count nested environment to pick the correct \end
	let nestingDepth = 0;

	// traverse the node tree and search for an end
	while (cursor.next()) {
		if (
			// @ts-ignore
			cursor.name == "CommandIdentifier" &&
			doc.slice(cursor.from, cursor.to).toString() == "\\begin") {
			nestingDepth++;
			continue;
		}

		if (
			// @ts-ignore-line
			cursor.name == "CommandIdentifier" &&
			doc.slice(cursor.from, cursor.to).toString() == "\\end"
		) {
			// if nested, go one step higher
			if (nestingDepth > 0) {
				nestingDepth--;
				continue;
			}

			// TODO weird from and to values
			if (!cursor.nextSibling()) {
				return {
					from: cursor.from,
					to: cursor.from,
					severity: "error",
					message: "\\end missing an environment name"
				}
			}

			if (cursor.name != "CommandArgument") {
				return {
					from: cursor.from,
					to: cursor.to,
					severity: "error",
					message: "environment name for \\end expected"
				}
			}

			const environmentEndNameArgument = doc.slice(cursor.from, cursor.to).toString();
			if (environmentEndNameArgument != environmentNameArgument) {
				return {
					from: cursor.from,
					to: cursor.to,
					severity: "error",
					message: `incorrect environment name, \\end${environmentNameArgument} expected, got \\end${environmentEndNameArgument}`
				}
			}

			return null;
		}
	}

	return {
		from: beginNode.from,
		to: beginNode.to,
		severity: "error",
		message: "Matching \\end not found"
	};
}

function checkForMatchingLeftBrace(beginNode: SyntaxNodeRef, view: EditorView, diagnostics: Diagnostic[]): void {
	const cursor = syntaxTree(view.state).cursor();

	// get { node
	cursor.moveTo(beginNode.to, -1);

	let nestingDepth = 0;

	while (cursor.next()) {
		if (cursor.name == "{") {
			nestingDepth++;
			continue;
		}

		if (cursor.name == "}" && nestingDepth > 0) {
			nestingDepth--;
			continue;
		}

		if (cursor.name == "}" && nestingDepth == 0) {
			return;
		}
	}

	diagnostics.push({
		from: beginNode.from,
		to: beginNode.to,
		severity: "error",
		message: "Unmatched {, missing }"
	});
}

function checkForMatchingRightBrace(beginNode: SyntaxNodeRef, view: EditorView, diagnostics: Diagnostic[]): void {
	const cursor = syntaxTree(view.state).cursor();

	// get { node
	cursor.moveTo(beginNode.to, -1);

	let nestingDepth = 0;

	while (cursor.prev()) {
		if (cursor.name == "}") {
			nestingDepth++;
			continue;
		}

		if (cursor.name == "{" && nestingDepth > 0) {
			nestingDepth--;
			continue;
		}

		if (cursor.name == "{" && nestingDepth == 0) {
			return;
		}
	}

	diagnostics.push({
		from: beginNode.from,
		to: beginNode.to,
		severity: "error",
		message: "Unmatched }, missing {"
	});
}

export function latexLinter(view: EditorView): Diagnostic[] {
	let diagnostics: Diagnostic[] = [];

	const doc = view.state.doc;
	const tree = syntaxTree(view.state).cursor();

	tree.iterate(node => {
		if (node.name == "CommandIdentifier" && doc.slice(node.from, node.to).toString() == "\\begin") {
			// Find corresponding `\end`
			const environmentError = checkEnvironment(node, view);
			if (environmentError) {
				diagnostics.push(environmentError);
			}
		}

		if (node.name == "{") {
			checkForMatchingLeftBrace(node, view, diagnostics);
		}

		if (node.name == "}") {
			checkForMatchingRightBrace(node, view, diagnostics);
		}

		if (node.name == "Text") {
			const re = / - /;
			const text = view.state.doc.slice(node.from, node.to).toString();
			const match = re.exec(text);
			if (match != null) {
				diagnostics.push({
					from: node.from + match.index,
					to: node.from + match.index + 3, // 3 is the length of ' - '
					severity: "error",
					message: "This is not a dash, use ' -- ' instead of ' - '",
				})
			}
		}
	});
	return diagnostics;
}

export function latex() {
	return new LanguageSupport(latexLanguage, [
		latexCompletion
	]);
}
