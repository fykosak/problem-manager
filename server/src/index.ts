
import * as Y from 'yjs';
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import * as http from 'http';
import WebSocket from 'ws';
// @ts-ignore
import { setPersistence, setupWSConnection, WSSharedDoc } from './yjs';

// created for each request
const createContext = ({
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();
const appRouter = t.router({
	getUser: t.procedure.input(z.string()).query((opts) => {
		opts.input; // string
		return {
			id: opts.input,
			name: 'Bilbo'
		};
	})
});

const app = express();
app.use(cors());
app.use(
	'/trpc',
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	}),
);

const server = http.createServer(app).listen(4000);

const websocketServer = new WebSocket.Server({
	noServer: true
});
websocketServer.on('connection', setupWSConnection);

const yPersistance = {
	provider: null,
	bindState: async (docName: string, ydoc: WSSharedDoc) => {
		console.log("bind " + ydoc.name);
		//const persistedYdoc = await ldb.getYDoc(docName);
		const persistedYdoc = new WSSharedDoc(docName);
		//const newUpdates = Y.encodeStateAsUpdate(ydoc);
		//ldb.storeUpdate(docName, newUpdates);
		Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
		ydoc.on('update', (update: Uint8Array) => {
			console.log("apply update " + ydoc.name);
			//ldb.storeUpdate(docName, update);
		})
		ydoc.on('destroy', (doc: Y.Doc) => {
			console.log("apply destroy " + docName);
		})
	},
	writeState: async (_docName: string, ydoc: WSSharedDoc) => {
		console.log("apply write " + ydoc.name);
	}
}

setPersistence(yPersistance);

server.on('upgrade', (request, socket, head) => {
	console.log("connection upgrade " + request.url);
	websocketServer.handleUpgrade(request, socket, head, (ws) => {
		websocketServer.emit('connection', ws, request);
	});
});

export type AppRouter = typeof appRouter;
