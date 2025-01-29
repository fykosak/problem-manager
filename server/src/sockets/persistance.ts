import * as Y from 'yjs';
import type { WSSharedDoc } from './yjs';
import { StorageProvider } from './storageProvider';
import { db } from '../db';
import { desc, eq } from 'drizzle-orm';
import { textVersionTable } from '../db/schema';

const SNAPSHOT_INACTIVITIY_THRESHOLD = 30 * 1000; // 30 seconds
const SNAPSHOT_PERIODICITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const storage = new StorageProvider();

async function takeSnapshot(textId: number, ydoc: WSSharedDoc) {
	console.log("take snapshot");
	const text = ydoc.getText().toJSON();
	await db.insert(textVersionTable).values({
		textId: textId,
		contents: text
	})
}

let snapshotTimeouts = new Map<number, Timer>();

/**
 * Creates a timeout that saves a document version after `SNAPSHOT_INACTIVITIY_THRESHOLD` miliseconds of inactivity.
 * When check, it takes it as a activity and resets the timeout back to its original value.
 */
async function checkSnapshotTimeout(textId: number, ydoc: WSSharedDoc) {
	const timeout = snapshotTimeouts.get(textId);
	if (!timeout) {
		snapshotTimeouts.set(textId, setTimeout(() => takeSnapshot(textId, ydoc), SNAPSHOT_INACTIVITIY_THRESHOLD));
		return;
	}

	clearTimeout(timeout);
	snapshotTimeouts.set(textId, setTimeout(() => takeSnapshot(textId, ydoc), SNAPSHOT_INACTIVITIY_THRESHOLD));
}

/**
 * Checks if time from the last version is more then `SNAPSHOT_PERIODICITY_THRESHOLD` and if so, creates a new version.
 */
async function checkSnapshotPeriodicity(textId: number, ydoc: WSSharedDoc) {
	const lastSnapshot = await db.query.textVersionTable.findFirst({
		where: eq(textVersionTable.textId, textId),
		orderBy: desc(textVersionTable.created)
	});

	if (lastSnapshot) {
		if (((new Date()).getTime() - lastSnapshot.created.getTime()) < SNAPSHOT_PERIODICITY_THRESHOLD) {
			return;
		}
	}

	console.log("take periodicity snapshot");
	takeSnapshot(textId, ydoc);
}

export const persistance = {
	provider: null,
	bindState: async (docName: string, ydoc: WSSharedDoc) => {
		console.log("bind " + docName);
		// Sync passed ydoc and persisted ydoc by getting all updates from
		// passed ydoc, save them to persisted ydoc, get all updates
		// from persisted doc and apply them to passed ydoc.
		// This works because updates are idempotent and can be reapplied.
		const textId = parseInt(docName);
		const persistedYdoc = await storage.getYDoc(textId);
		const currentUpdates = Y.encodeStateAsUpdate(ydoc);
		storage.storeUpdate(textId, currentUpdates);
		Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

		ydoc.on('update', (update: Uint8Array) => {
			console.log("apply update " + ydoc.name);
			storage.storeUpdate(textId, update);
			checkSnapshotTimeout(textId, ydoc);
			checkSnapshotPeriodicity(textId, ydoc);
		});
		ydoc.on('destroy', (doc: Y.Doc) => {
			console.log("apply destroy " + docName);
		});
	},
	writeState: async (_docName: string, ydoc: WSSharedDoc) => {
		console.log("apply write " + ydoc.name);
	}
}
