/**
 * Websocket server for a Yjs connection.
 *
 * This is a modified code from https://github.com/yjs/y-websocket-server/blob/3dff975c68a035cd0b29992cc688ecb52540eb21/src/utils.js
 * Copied here because it's not a library but a standalone implementation that
 * is supposted to be a minimal example for other implementations.
 */
// @ts-nocheck
import { eq } from 'drizzle-orm';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as map from 'lib0/map';
// @ts-ignore
import * as debounce from 'lodash.debounce';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
// @ts-ignore
import { callbackHandler, isCallbackSet } from 'y-websocket/bin/callback';
import * as Y from 'yjs';

import { acl } from '@server/acl/aclFactory';
import {
	getJWTFromHeader,
	getPersonFromJWT,
	getRolesFromJWT,
} from '@server/auth/jwt';
import { db } from '@server/db';
import { textTable } from '@server/db/schema';

const CALLBACK_DEBOUNCE_WAIT = parseInt(
	process.env.CALLBACK_DEBOUNCE_WAIT || '2000'
);
const CALLBACK_DEBOUNCE_MAXWAIT = parseInt(
	process.env.CALLBACK_DEBOUNCE_MAXWAIT || '10000'
);

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
//const wsReadyStateClosing = 2 // eslint-disable-line
//const wsReadyStateClosed = 3 // eslint-disable-line

// disable gc when using snapshots!
const gcEnabled = process.env.GC !== 'false' && process.env.GC !== '0';

export interface persistenceType {
	bindState: Function;
	writeState: Function;
	provider: unknown;
}
let persistence: persistenceType | null = null;

export function setPersistence(persistence_: persistenceType) {
	persistence = persistence_;
}

export function getPersistence(): persistenceType | null {
	return persistence;
}

export const docs = new Map<string, WSSharedDoc>();

const messageSync = 0;
const messageAwareness = 1;
// const messageAuth = 2

const updateHandler = (
	update: Uint8Array,
	_origin: any,
	doc: WSSharedDoc,
	_tr: any
) => {
	const encoder = encoding.createEncoder();
	encoding.writeVarUint(encoder, messageSync);
	syncProtocol.writeUpdate(encoder, update);
	const message = encoding.toUint8Array(encoder);
	doc.conns.forEach((_, conn) => {
		send(doc, conn, message);
	});
};

let contentInitializor = (_ydoc: Y.Doc) => Promise.resolve();

export function setContentInitializor(f: (ydoc: Y.Doc) => Promise<void>) {
	contentInitializor = f;
}

export class WSSharedDoc extends Y.Doc {
	public name: string;

	/**
	 * Maps from conn to set of controlled user ids. Delete all user ids from awareness when this conn is closed
	 */
	public conns = new Map<object, Set<number>>();
	public awareness: awarenessProtocol.Awareness;
	public whenInitialized: Promise<void>;

	constructor(name: string) {
		super({ gc: gcEnabled });
		this.name = name;
		/**
		 * @type {awarenessProtocol.Awareness}
		 */
		this.awareness = new awarenessProtocol.Awareness(this);
		this.awareness.setLocalState(null);
		/**
		 * @param {{ added: Array<number>, updated: Array<number>, removed: Array<number> }} changes
		 */
		const awarenessChangeHandler = (
			{
				added,
				updated,
				removed,
			}: {
				added: number[];
				updated: number[];
				removed: number[];
			},
			conn: object | null
		) => {
			const changedClients = added.concat(updated, removed);
			if (conn !== null) {
				const connControlledIDs =
					/** @type {Set<number>} */ this.conns.get(conn);
				if (connControlledIDs !== undefined) {
					added.forEach((clientID) => {
						connControlledIDs.add(clientID);
					});
					removed.forEach((clientID) => {
						connControlledIDs.delete(clientID);
					});
				}
			}
			// broadcast awareness update
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageAwareness);
			encoding.writeVarUint8Array(
				encoder,
				awarenessProtocol.encodeAwarenessUpdate(
					this.awareness,
					changedClients
				)
			);
			const buff = encoding.toUint8Array(encoder);
			this.conns.forEach((_, c) => {
				send(this, c, buff);
			});
		};
		this.awareness.on('update', awarenessChangeHandler);
		this.on('update', /** @type {any} */ updateHandler);
		if (isCallbackSet) {
			this.on(
				'update',
				/** @type {any} */ debounce(
					callbackHandler,
					CALLBACK_DEBOUNCE_WAIT,
					{ maxWait: CALLBACK_DEBOUNCE_MAXWAIT }
				)
			);
		}
		this.whenInitialized = contentInitializor(this);
	}
}

/**
 * Gets a Y.Doc by name, whether in memory or on disk
 *
 * @return {WSSharedDoc}
 */
export function getYDoc(docname: string, gc = true): WSSharedDoc {
	return map.setIfUndefined(docs, docname, () => {
		const doc = new WSSharedDoc(docname);
		doc.gc = gc;
		if (persistence !== null) {
			persistence.bindState(docname, doc);
		}
		docs.set(docname, doc);
		return doc;
	});
}

const messageListener = (conn: any, doc: WSSharedDoc, message: Uint8Array) => {
	try {
		const encoder = encoding.createEncoder();
		const decoder = decoding.createDecoder(message);
		const messageType = decoding.readVarUint(decoder);
		switch (messageType) {
			case messageSync:
				encoding.writeVarUint(encoder, messageSync);
				syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

				// If the `encoder` only contains the type of reply message and no
				// message, there is no need to send the message. When `encoder` only
				// contains the type of reply, its length is 1.
				if (encoding.length(encoder) > 1) {
					send(doc, conn, encoding.toUint8Array(encoder));
				}
				break;
			case messageAwareness: {
				awarenessProtocol.applyAwarenessUpdate(
					doc.awareness,
					decoding.readVarUint8Array(decoder),
					conn
				);
				break;
			}
		}
	} catch (err) {
		console.error(err);
		// @ts-ignore
		doc.emit('error', [err]);
	}
};

function closeConn(doc: WSSharedDoc, conn: any): void {
	if (doc.conns.has(conn)) {
		// @ts-ignore
		const controlledIds: Set<number> = doc.conns.get(conn);
		doc.conns.delete(conn);
		awarenessProtocol.removeAwarenessStates(
			doc.awareness,
			Array.from(controlledIds),
			null
		);
		if (doc.conns.size === 0 && persistence !== null) {
			// if persisted, we store state and destroy ydocument
			persistence.writeState(doc.name, doc).then(() => {
				doc.destroy();
			});
			docs.delete(doc.name);
		}
	}
	conn.close();
}

const send = (
	doc: WSSharedDoc,
	conn: import('ws').WebSocket,
	m: Uint8Array
) => {
	if (
		conn.readyState !== wsReadyStateConnecting &&
		conn.readyState !== wsReadyStateOpen
	) {
		closeConn(doc, conn);
	}
	try {
		conn.send(m, {}, (err) => {
			err != null && closeConn(doc, conn);
		});
		// eslint-disable-next-line
	} catch (e) {
		closeConn(doc, conn);
	}
};

const pingTimeout = 30000;

export async function setupWSConnection(
	conn: import('ws').WebSocket,
	req: import('http').IncomingMessage,
	{ docName = (req.url || '').slice(1).split('?')[0], gc = true } = {}
) {
	const textId = parseInt(docName);
	const text = await db.query.textTable.findFirst({
		where: eq(textTable.textId, textId),
		with: {
			problem: {
				with: {
					contest: true,
					series: {
						with: {
							contestYear: {
								with: {
									contest: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!text) {
		ws.close(4004, 'Text does not exist');
	}

	// Authenticate and authorize user
	const url = new URL((req.headers.origin ?? 'http://localhost') + req.url);

	const authorization = url.searchParams.get('auth');

	if (!authorization) {
		conn.close(3000, 'Unauthorized');
		return;
	}

	const jwtData = await getJWTFromHeader(authorization);

	if (!jwtData) {
		conn.close(3000, 'Unauthorized');
		return;
	}

	const person = await getPersonFromJWT(jwtData);
	if (!person) {
		conn.close(3000, 'Unauthorized');
		return;
	}

	const roles = getRolesFromJWT(jwtData);
	if (!roles) {
		conn.close(3000, 'Unauthorized');
		return;
	}

	if (
		!acl.isAllowedContest(
			roles,
			text.problem.contest
				? text.problem.contest.symbol
				: text.problem.series.contestYear.contest.symbol,
			'text',
			'edit'
		)
	) {
		conn.close(3000, 'Unauthorized');
		return;
	}

	conn.binaryType = 'arraybuffer';
	// get doc, initialize if it does not exist yet
	const doc = getYDoc(docName, gc);
	await doc.whenInitialized;
	doc.conns.set(conn, new Set());
	// listen and reply to events
	conn.on('message', (message: ArrayBuffer) => {
		messageListener(conn, doc, new Uint8Array(message));
	});

	// Check if connection is still alive
	let pongReceived = true;
	const pingInterval = setInterval(() => {
		if (!pongReceived) {
			if (doc.conns.has(conn)) {
				closeConn(doc, conn);
			}
			clearInterval(pingInterval);
		} else if (doc.conns.has(conn)) {
			pongReceived = false;
			try {
				conn.ping();
				// eslint-disable-next-line
			} catch (e) {
				closeConn(doc, conn);
				clearInterval(pingInterval);
			}
		}
	}, pingTimeout);
	conn.on('close', () => {
		closeConn(doc, conn);
		clearInterval(pingInterval);
	});
	conn.on('pong', () => {
		pongReceived = true;
	});
	// put the following in a variables in a block so the interval handlers don't keep in in
	// scope
	{
		// send sync step 1
		const encoder = encoding.createEncoder();
		encoding.writeVarUint(encoder, messageSync);
		syncProtocol.writeSyncStep1(encoder, doc);
		send(doc, conn, encoding.toUint8Array(encoder));
		const awarenessStates = doc.awareness.getStates();
		if (awarenessStates.size > 0) {
			const encoder = encoding.createEncoder();
			encoding.writeVarUint(encoder, messageAwareness);
			encoding.writeVarUint8Array(
				encoder,
				awarenessProtocol.encodeAwarenessUpdate(
					doc.awareness,
					Array.from(awarenessStates.keys())
				)
			);
			send(doc, conn, encoding.toUint8Array(encoder));
		}
	}
}
