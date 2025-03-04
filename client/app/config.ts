import jsonConfig from 'config.json';

class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigError';
	}
}

// The file can be changed without rebuild, so it should not be
// expected to have a fixed type and it needs to be checked.
const jsonConfigTyped = jsonConfig as Record<string, unknown>;

function getRequiredString(property: string): string {
	const propertyValue = jsonConfigTyped[property];
	if (!propertyValue) {
		throw new ConfigError(`Config value ${property} not specified`);
	}
	if (typeof propertyValue !== 'string') {
		throw new ConfigError(`Config value ${property} is not a string`);
	}
	return propertyValue;
}

/**
 * Typed config values derived from config.json
 */
const config = {
	/** Root app url, for example https://pm.example.com */
	ROOT_URL: getRequiredString('ROOT_URL'),
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	OIDC_AUTHORITY_URL: getRequiredString('OIDC_AUTHORITY_URL'),
	OIDC_CLIENT_ID: getRequiredString('OIDC_CLIENT_ID'),
};

export default config;
