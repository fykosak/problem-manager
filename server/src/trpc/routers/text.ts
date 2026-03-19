import { eq } from 'drizzle-orm';

import { generateHtmlFromString } from '@server/api/compiler/generateHtml';
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

	const html = await generateHtmlFromString(
		contents,
		text.problemId,
		text.lang,
		text.type
	);

	await db
		.update(textTable)
		.set({ html })
		.where(eq(textTable.textId, textId));
}
