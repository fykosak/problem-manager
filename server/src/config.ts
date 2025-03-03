import { readFileSync } from 'fs';

class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigError';
	}
}

const jsonConfig = JSON.parse(readFileSync('./config.json').toString());

function getRequiredString(property: string): string {
	let propertyValue = jsonConfig[property];
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
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	OIDC_CERTS_URL: getRequiredString('OIDC_CERTS_URL'),
};

export default config;
