import { LanguageSupport } from '@codemirror/language';

import { basicCompletion, mathCompletion } from './completion';
import { environmentFolding } from './folding';
import { latexLanguage } from './language';

export { latexLanguage } from './language';
export { latexLinter } from './linter';
export { ParserInput } from './parserInput';

export function latex() {
	return new LanguageSupport(latexLanguage, [
		basicCompletion,
		mathCompletion,
		environmentFolding,
	]);
}
