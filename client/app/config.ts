import { ConfigError } from '@server/config/configUtils';

/**
 * Gets string type from env property
 */
function getRequiredString(property: string) {
	const propertyValue = import.meta.env[property]; // eslint-disable-line
	if (!propertyValue) {
		throw new ConfigError(`Property ${property} not specified`);
	}
	if (typeof propertyValue !== 'string') {
		throw new ConfigError(`Property ${property} is not a string`);
	}
	return propertyValue;
}

/**
 * Global app config
 */
export const config = {
	/** Root app url, for example https://pm.example.com */
	ROOT_URL: getRequiredString('VITE_ROOT_URL'),
	/** App API url, for example https://api.example.com */
	API_URL: getRequiredString('VITE_API_URL'),
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	OIDC_AUTHORITY_URL: getRequiredString('VITE_OIDC_AUTHORITY_URL'),
	OIDC_CLIENT_ID: getRequiredString('VITE_OIDC_CLIENT_ID'),
};
