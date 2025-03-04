import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { User } from 'oidc-client-ts';
import type { AppRouter } from '@server/trpc/appRouter';
import config from './config';

function getUser() {
	const authority = config.OIDC_AUTHORITY_URL;
	const clientId = config.OIDC_CLIENT_ID;
	const oidcStorage = sessionStorage.getItem(
		`oidc.user:${authority}:${clientId}`
	);

	if (!oidcStorage) {
		return null;
	}

	return User.fromStorageString(oidcStorage);
}

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: 'http://localhost:8081/trpc',
			headers: () => {
				const user = getUser();
				return {
					Authorization: user ? 'Bearer ' + user.access_token : '',
				};
			},
		}),
	],
});

export type trpcInputTypes = inferRouterInputs<AppRouter>;
export type trpcOutputTypes = inferRouterOutputs<AppRouter>;
