import { eq } from 'drizzle-orm';
import * as Y from 'yjs';

import { db } from '../db';
import { textTable } from '../db/schema';
import type { WSSharedDoc } from './yjs';

export class StorageProvider {
	async getYDoc(textId: number): Promise<Y.Doc> {
		console.log('StorageProvider: getYDoc');
		const text = await db.query.textTable.findFirst({
			where: eq(textTable.textId, textId),
		});

		const doc = new Y.Doc();
		// create text if it does not exist
		if (!text || !text.contents) {
			return doc;
		}

		// restore doc by applying the saved data
		Y.applyUpdate(doc, text.contents);
		return doc;
	}

	async storeUpdate(textId: number, update: Uint8Array) {
		console.log('StorageProvider: storeUpdate');
		const doc = await this.getYDoc(textId);

		Y.applyUpdate(doc, update);

		//console.log(`new contents: ${doc.getText().toJSON()}`);

		await db
			.update(textTable)
			.set({
				contents: Y.encodeStateAsUpdate(doc),
			})
			.where(eq(textTable.textId, textId));
	}

	async storeDocument(textId: number, ydoc: WSSharedDoc) {
		console.log('StorageProvider: storeDocument');

		//console.log(`new contents: ${ydoc.getText().toJSON()}`);

		await db
			.update(textTable)
			.set({
				contents: Y.encodeStateAsUpdate(ydoc),
			})
			.where(eq(textTable.textId, textId));
	}
}
