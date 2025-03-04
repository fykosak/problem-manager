import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import * as http from 'http';
import WebSocket from 'ws';
import { setPersistence, setupWSConnection } from './sockets/yjs';
import { persistance } from './sockets/persistance';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/appRouter';

const app = express();
app.use(cors());
app.use(express.json());
app.use(
	'/trpc',
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	})
);

const server = http.createServer(app).listen(8080, () => {
	console.log('Server running');
});

const websocketServer = new WebSocket.Server({
	noServer: true,
});

websocketServer.on('connection', setupWSConnection);

setPersistence(persistance);

server.on('upgrade', (request, socket, head) => {
	websocketServer.handleUpgrade(request, socket, head, (ws) => {
		websocketServer.emit('connection', ws, request);
	});
});
