import { eq } from 'drizzle-orm';
import { ParserInput, latexLanguage } from 'lang-latex';

import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { db } from '@server/db';
import { textTable } from '@server/db/schema';
import { StorageProvider } from '@server/sockets/storageProvider';

export async function releaseText(textId: number, problemId: number) {
	console.log(`Exporting text ${textId} for problem ${problemId}`);
	const ydocStorage = new StorageProvider();
	const ydoc = await ydocStorage.getYDoc(textId);
	const contents = ydoc.getText().toJSON();

	const parserInput = new ParserInput(contents);
	const tree = latexLanguage.parser.parse(parserInput);

	const generator = new HtmlGenerator(tree, parserInput, problemId);
	const html = await generator.generateHtml();
	await db
		.update(textTable)
		.set({ html })
		.where(eq(textTable.textId, textId));
}
