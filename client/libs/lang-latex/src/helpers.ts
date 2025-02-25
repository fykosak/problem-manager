import { Text } from '@codemirror/state';
import { TreeCursor } from '@lezer/common';

/**
 * Takes cursor as an argument and traverse the tree to find
 * matching \end to a \begin. This is done by counting how many
 * begins and ends it saw to know how much it is nested. When it
 * finds \end on a correct level, it returns.
 *
 * Returns true when found, false when not found (reached end of the Document).
 * It does **not** check for a correct environment name.
 *
 * Modifies the cursor position. When it returns true, the cursor will end up
 * on the \end CommandIdentifier token.
 *
 * Expects the initial cursor position after starting \begin, not on it.
 */
export function moveToEnvironmentEnd(cursor: TreeCursor, doc: Text) {
	// count nested environments
	let nestingDepth = 0;

	// traverse the node tree and search for an end
	while (cursor.next()) {
		if (
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\begin'
		) {
			nestingDepth++;
			continue;
		}

		if (
			cursor.name == 'CommandIdentifier' &&
			doc.slice(cursor.from, cursor.to).toString() == '\\end'
		) {
			if (nestingDepth > 0) {
				nestingDepth--;
				continue;
			}

			return true;
		}
	}

	return false;
}
