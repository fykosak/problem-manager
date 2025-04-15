import * as trpcExpress from '@trpc/server/adapters/express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import config from '@server/config/config';

export async function createContext({
	req,
}: trpcExpress.CreateExpressContextOptions) {
	async function getUserFromHeader() {
		if (!req.headers.authorization) {
			return null;
		}

		const [authType, accessToken] = req.headers.authorization.split(' ');
		if (authType != 'Bearer') {
			return null;
		}

		const jwks = createRemoteJWKSet(new URL(config.oidcCertsUrl));
		try {
			const { payload } = await jwtVerify(accessToken, jwks);
			return payload;
		} catch {
			return null;
		}
	}

	const jwtData = await getUserFromHeader();

	return {
		jwtData,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
