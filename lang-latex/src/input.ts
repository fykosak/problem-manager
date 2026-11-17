import { Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

/**
 * Count number of backslashes to determine if the next char should be escaped (odd
 * count) or not (even count).
 */
export function isEscaped(textBefore: string) {
	let backslashes = 0;
	for (let pos = textBefore.length - 1; pos >= 0; pos--) {
		if (textBefore[pos] !== '\\') {
			break;
		}
		backslashes++;
	}
	return backslashes % 2 === 1;
}

/**
 * Handler preventing completing dollar signs when escaped.
 */
export const escapedDollarHandler = Prec.high(
	EditorView.inputHandler.of((view, from, to, insert) => {
		if (insert !== '$' || from !== to) {
			return false;
		}

		if (!isEscaped(view.state.doc.sliceString(0, from))) {
			return false;
		}

		view.dispatch({
			changes: { from, to, insert },
			selection: { anchor: from + insert.length },
			userEvent: 'input.type',
		});
		return true;
	})
);
