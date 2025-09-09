import { eq } from 'drizzle-orm';
import { ParserInput, latexLanguage } from 'lang-latex';

import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { db } from '@server/db';
import { textTable } from '@server/db/schema';
import { StorageProvider } from '@server/sockets/storageProvider';

export async function releaseText(textId: number) {
	const text = await db.query.textTable.findFirst({
		where: eq(textTable.textId, textId),
	});
	if (!text) {
		throw new Error(`Text ${textId} does not exist`);
	}

	console.log(`Exporting text ${textId} for problem ${text.problemId}`);

	const ydocStorage = new StorageProvider();
	const ydoc = await ydocStorage.getYDoc(textId);
	const contents = ydoc.getText().toJSON();

	const parserInput = new ParserInput(contents);
	const tree = latexLanguage.parser.parse(parserInput);

	const generator = new HtmlGenerator(
		tree,
		parserInput,
		text.problemId,
		text.type,
		text.lang
	);
	const html = await generator.generateHtml();
	await db
		.update(textTable)
		.set({ html })
		.where(eq(textTable.textId, textId));
}
