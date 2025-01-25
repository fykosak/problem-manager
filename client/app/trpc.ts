import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/index';

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:8081/trpc',
		}),
	],
});

export type trpcInputTypes = inferRouterInputs<AppRouter>;
export type trpcOutputTypes = inferRouterOutputs<AppRouter>;
