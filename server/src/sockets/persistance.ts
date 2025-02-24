import * as Y from 'yjs';
import type { WSSharedDoc, persistenceType } from './yjs';
import { StorageProvider } from './storageProvider';
import { db } from '../db';
import { desc, eq } from 'drizzle-orm';
import { textVersionTable } from '../db/schema';

const SNAPSHOT_INACTIVITIY_THRESHOLD = 30 * 1000; // 30 seconds
const SNAPSHOT_PERIODICITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes

const storage = new StorageProvider();

// TODO better name
class Keeper {
	textId: number;
	ydoc: WSSharedDoc;
	inactivityTimeout: Timer | null = null;
	editors = new Set<number>();
	permanentUserData: Y.PermanentUserData;

	constructor(textId: number, ydoc: WSSharedDoc) {
		this.textId = textId;
		this.ydoc = ydoc;
		this.setInactivityTimeout();
		this.permanentUserData = new Y.PermanentUserData(ydoc);
	}

	private setInactivityTimeout() {
		this.inactivityTimeout = setTimeout(
			async () => { await this.takeSnapshot(); },
			SNAPSHOT_INACTIVITIY_THRESHOLD
		);
	}

	private async takeSnapshot() {
		const text = this.ydoc.getText().toJSON();
		const lastText = await db.query.textVersionTable.findFirst({
			where: eq(textVersionTable.textId, this.textId),
			orderBy: desc(textVersionTable.created),
		});

		if (lastText?.contents === text) {
			return;
		}

		console.log('take snapshot');
		await db.insert(textVersionTable).values({
			textId: this.textId,
			contents: text,
			// personId: editors // TODO
		});
		this.editors.clear();
	}

	/**
	 * Creates a timeout that saves a document version after `SNAPSHOT_INACTIVITIY_THRESHOLD` miliseconds of inactivity.
	 * When checked, it takes it as an activity and resets the timeout back to its original value.
	 */
	public checkInactivity() {
		// start first timeout if not set
		if (!this.inactivityTimeout) {
			this.setInactivityTimeout();
			return;
		}

		// reset timeout
		clearTimeout(this.inactivityTimeout);
		this.setInactivityTimeout();
	}

	/**
	 * Checks if time from the last version is more then `SNAPSHOT_PERIODICITY_THRESHOLD` and if so, creates a new version.
	 */
	public async checkPeriodicity() {
		const lastSnapshot = await db.query.textVersionTable.findFirst({
			where: eq(textVersionTable.textId, this.textId),
			orderBy: desc(textVersionTable.created),
		});

		if (lastSnapshot) {
			if (
				new Date().getTime() - lastSnapshot.created.getTime() <
				SNAPSHOT_PERIODICITY_THRESHOLD
			) {
				return;
			}
		}

		console.log('take periodicity snapshot');
		this.takeSnapshot();
	}

	public registerUpdate(updateData: Uint8Array) {
		const update = Y.decodeUpdate(updateData);
		for (const change of update.structs) {
			const person = this.permanentUserData.getUserByClientId(
				change.id.client
			);
			this.editors.add(person);
		}
	}
}

const keepers = new Map<number, Keeper>();

export const persistance: persistenceType = {
	provider: null,
	bindState: async (docName: string, ydoc: WSSharedDoc) => {
		console.log('bind ' + docName);

		/**
		 * Sync passed ydoc and persisted ydoc by getting all updates from
		 * passed ydoc, save them to persisted ydoc, get all updates
		 * from persisted doc and apply them to passed ydoc.
		 * This works because updates are idempotent and can be reapplied.
		 */
		const textId = parseInt(docName);
		const persistedYdoc = await storage.getYDoc(textId);
		const currentUpdates = Y.encodeStateAsUpdate(ydoc);
		storage.storeUpdate(textId, currentUpdates);
		Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

		let keeper = keepers.get(textId);
		if (!keeper) {
			keeper = new Keeper(textId, ydoc);
			keepers.set(textId, keeper);
		}

		ydoc.on('update', async (update: Uint8Array) => {
			console.log('apply update ' + ydoc.name);
			//await storage.storeUpdate(textId, update);
			await storage.storeDocument(textId, ydoc);
			keeper.registerUpdate(update);
			keeper.checkInactivity();
			keeper.checkPeriodicity();
			//console.log('current contents: ' + ydoc.getText().toJSON());
		});
		ydoc.on('destroy', (doc: Y.Doc) => {
			console.log('apply destroy ' + docName);
		});
	},
	writeState: async (_docName: string, ydoc: WSSharedDoc) => {
		console.log('apply write ' + ydoc.name);
	},
};
