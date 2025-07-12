import * as trpcExpress from '@trpc/server/adapters/express';

import { getJWTFromHeader } from '@server/auth/jwt';

export async function createContext({
	req,
}: trpcExpress.CreateExpressContextOptions) {
	if (!req.headers.authorization) {
		return {
			jwtData: null,
		};
	}

	const jwtData = await getJWTFromHeader(req.headers.authorization);

	return {
		jwtData,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
