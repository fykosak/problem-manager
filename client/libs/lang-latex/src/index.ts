import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { styleTags, tags as t } from "@lezer/highlight"

export const latexLanguage = LRLanguage.define({
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				Application: delimitedIndent({ closing: ")", align: false })
			}),
			foldNodeProp.add({
				InlineMath: foldInside
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

export function latex() {
	return new LanguageSupport(latexLanguage);
}
