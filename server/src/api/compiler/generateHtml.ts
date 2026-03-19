import { ParserInput, latexLanguage } from 'lang-latex';

import type { LangEnum, TextTypeEnum } from '@server/db/schema';

import { HtmlGenerator } from './htmlGenerator';

export async function generateHtmlFromString(
	inputString: string,
	problemId: number,
	lang: LangEnum,
	type?: TextTypeEnum
) {
	const parserInput = new ParserInput(inputString);
	const tree = latexLanguage.parser.parse(parserInput);
	const generator = new HtmlGenerator(
		tree,
		parserInput,
		problemId,
		lang,
		type
	);
	return await generator.generateHtml();
}
