import { LanguageSupport } from '@codemirror/language';
import { Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { basicCompletion, mathCompletion } from './completion';
import { environmentFolding } from './folding';
import { isEscaped } from './input';
import { latexLanguage } from './language';

const escapedDollarHandler = Prec.high(
	EditorView.inputHandler.of((view, from, to, insert) => {
		if (insert !== '$' || from !== to) return false;

		if (!isEscaped(view.state.doc.sliceString(0, from))) return false;

		view.dispatch({
			changes: { from, to, insert },
			selection: { anchor: from + insert.length },
			userEvent: 'input.type',
		});
		return true;
	})
);

export { latexLanguage } from './language';
export { latexLinter } from './linter';
export { ParserInput } from './parserInput';

export function latex() {
	return new LanguageSupport(latexLanguage, [
		escapedDollarHandler,
		basicCompletion,
		mathCompletion,
		environmentFolding,
	]);
}
