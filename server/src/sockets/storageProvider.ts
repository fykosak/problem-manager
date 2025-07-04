import { eq } from 'drizzle-orm';
import * as Y from 'yjs';

import { db } from '../db';
import { textTable } from '../db/schema';
import type { WSSharedDoc } from './yjs';

export class StorageProvider {
	async getYDoc(textId: number): Promise<Y.Doc> {
		const text = await db.query.textTable.findFirst({
			where: eq(textTable.textId, textId),
		});

		if (!text) {
			throw new Error(`Text ${textId} does not exist`);
		}

		const doc = new Y.Doc();
		if (text.contents) {
			// restore doc by applying the saved data
			Y.applyUpdate(doc, text.contents);
		}

		return doc;
	}

	async storeUpdate(textId: number, update: Uint8Array) {
		const doc = await this.getYDoc(textId);

		Y.applyUpdate(doc, update);

		await db
			.update(textTable)
			.set({
				contents: Y.encodeStateAsUpdate(doc),
			})
			.where(eq(textTable.textId, textId));
	}

	async storeDocument(textId: number, ydoc: WSSharedDoc) {
		await db
			.update(textTable)
			.set({
				contents: Y.encodeStateAsUpdate(ydoc),
			})
			.where(eq(textTable.textId, textId));
	}
}
