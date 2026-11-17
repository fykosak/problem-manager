import { type AnyRouter } from '@trpc/server';

import type { Context } from '@server/trpc/context';
import { trpc } from '@server/trpc/trpc';

export function createTestCaller<TRouter extends AnyRouter>(
	router: TRouter,
	context: Context
) {
	return trpc.createCallerFactory(router)(context);
}

export function createAuthedTrpcContext(
	personId: number,
	roles: string[] = []
): Context {
	return {
		jwtData: {
			person_id: personId,
			realm_access: { roles },
		},
	};
}
