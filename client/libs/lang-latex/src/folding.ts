import { EditorState } from "@codemirror/state"
import { foldService, syntaxTree } from "@codemirror/language";
import { moveToEnvironmentEnd } from "./helpers";

/**
 * Computes the ranges of environments for folding.
 * It's called from codemirror function, that iterates
 * over lines and calls this function on each one.
 *
 * @param {EditorState} state - current editor state
 * @param {number} start - index inside state doc, where the line starts
 */
export function foldEnvironment(state: EditorState, start: number): {
	from: number,
	to: number
} | null {
	const doc = state.doc;

	// position cursor to the command
	const cursor = syntaxTree(state).cursor();
	cursor.moveTo(start, 1);

	// find begin on selected line
	while (true) {
		if (cursor.name == "CommandIdentifier" && doc.slice(cursor.from, cursor.to).toString() == "\\begin") {
			break;
		}

		if (cursor.name == "Newline") {
			return null;
		}

		if (!cursor.next()) {
			return null;
		}
	}

	// get parent Command
	// @ts-ignore
	if (!cursor.parent() || cursor.name != "Command") {
		throw new Error("Parent 'Command' expected for CommandIdentifier");
	}

	// move cursor to the end of the Command to search for matching \end
	cursor.moveTo(cursor.to, -1);
	const startPosition = cursor.to;

	if (!moveToEnvironmentEnd(cursor, doc)) {
		return null;
	}

	return {
		from: startPosition,
		to: cursor.from
	}
}

export const manualFolding = foldService.of(foldEnvironment)
