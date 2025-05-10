import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import * as http from 'http';
import { WebSocketServer } from 'ws';

import { apiRouter } from './api/apiRouter';
import { persistance } from './sockets/persistance';
import { setPersistence, setupWSConnection } from './sockets/yjs';
import { appRouter } from './trpc/appRouter';
import { createContext } from './trpc/context';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10MB' }));
app.use('/api', apiRouter);

app.use(
	'/trpc',
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	})
);

// eslint-disable-next-line
const server = http.createServer(app).listen(8080, () => {
	console.log('Server running');
});

const websocketServer = new WebSocketServer({
	noServer: true,
});

websocketServer.on('connection', setupWSConnection);

setPersistence(persistance);

server.on('upgrade', (request, socket, head) => {
	websocketServer.handleUpgrade(request, socket, head, (ws) => {
		websocketServer.emit('connection', ws, request);
	});
});
