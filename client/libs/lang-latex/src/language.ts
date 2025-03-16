import {
	LRLanguage,
	delimitedIndent,
	foldInside,
	foldNodeProp,
	indentNodeProp,
} from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';

import { parser } from './syntax.grammar';

export const latexLanguage = LRLanguage.define({
	name: 'latex',
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				CommandArgument: delimitedIndent({
					closing: '}',
					align: false,
				}),
			}),
			foldNodeProp.add({
				InlineMath: foldInside,
				CommandArgument: foldInside,
				CommandArgumentOptional: foldInside,
			}),
			styleTags({
				InlineMathContent: t.string,
				CommandIdentifier: t.keyword,
				$: t.string,
				'( )': t.paren,
				'[ ]': t.squareBracket,
				'{ }': t.brace,
				Comment: t.comment,
			}),
		],
	}),
	languageData: {
		commentTokens: { line: '%' },
	},
});
