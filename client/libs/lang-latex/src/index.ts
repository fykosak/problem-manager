import { parser } from "./syntax.grammar"
import { LRLanguage, LanguageSupport, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language"
import { completeFromList } from "@codemirror/autocomplete"
import { styleTags, tags as t } from "@lezer/highlight"
import { manualFolding } from "./folding"
export { latexLinter } from "./linter"

export const latexLanguage = LRLanguage.define({
	name: 'latex',
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				CommandArgument: delimitedIndent({ closing: "}", align: false })
			}),
			foldNodeProp.add({
				InlineMath: foldInside,
				CommandArgument: foldInside,
				CommandArgumentOptional: foldInside
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

export function latex() {
	return new LanguageSupport(latexLanguage, [
		latexCompletion,
		manualFolding
	]);
}
