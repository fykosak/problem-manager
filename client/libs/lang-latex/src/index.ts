import { LanguageSupport } from '@codemirror/language';
import { environmentFolding } from './folding';
import { latexLanguage } from './language';
import { basicCompletion, mathCompletion } from './completion';

export { latexLinter } from './linter';

export function latex() {
	return new LanguageSupport(latexLanguage, [
		basicCompletion,
		mathCompletion,
		environmentFolding,
	]);
}
