import * as Y from 'yjs';
import type { WSSharedDoc } from './yjs';
import { StorageProvider } from './storageProvider';


const storage = new StorageProvider();

export const persistance = {
	provider: null,
	bindState: async (docName: string, ydoc: WSSharedDoc) => {
		console.log("bind " + docName);
		//const persistedYdoc = new WSSharedDoc(docName);
		//const newUpdates = Y.encodeStateAsUpdate(ydoc);
		//ldb.storeUpdate(docName, newUpdates);
		//Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

		const textId = parseInt(docName);

		// Sync passed ydoc and persisted ydoc by getting all updates from
		// passed ydoc, save them to persisted ydoc, get all updates
		// from persisted doc and apply them to passed ydoc.
		// This works because updates are idempotent and can be reapplied.
		const persistedYdoc = await storage.getYDoc(textId);
		const currentUpdates = Y.encodeStateAsUpdate(ydoc);
		storage.storeUpdate(textId, currentUpdates);
		Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update: Uint8Array) => {
			console.log("apply update " + ydoc.name);
			storage.storeUpdate(textId, update);
		})
		ydoc.on('destroy', (doc: Y.Doc) => {
			console.log("apply destroy " + docName);
		})
	},
	writeState: async (_docName: string, ydoc: WSSharedDoc) => {
		console.log("apply write " + ydoc.name);
	}
}
