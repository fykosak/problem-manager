import { getRequiredString } from '@server/configUtils';

export type Config = ReturnType<typeof setConfig>;

/**
 * Global app config. It's saved and retreived from global variable, because
 * there is no way to keep it in some form of react context and use it in
 * loader and trpc. Also cannot just load it in a plain file outside of react
 * router, because that breaks the server part (even on SPA).
 *
 * It should be set as the first part of client load to have the value available
 * for later use.
 */
export let config: Config | null = null;

export function setConfig(json: Record<string, unknown>) {
	const parsedConfig = {
		/** Root app url, for example https://pm.example.com */
		ROOT_URL: getRequiredString(json, 'ROOT_URL'),
		/** App API url, for example https://api.example.com */
		API_URL: getRequiredString(json, 'API_URL'),
		/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
		OIDC_AUTHORITY_URL: getRequiredString(json, 'OIDC_AUTHORITY_URL'),
		OIDC_CLIENT_ID: getRequiredString(json, 'OIDC_CLIENT_ID'),
	};

	config = parsedConfig;
	return parsedConfig;
}
