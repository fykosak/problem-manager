import { readFileSync } from 'fs';
import { getRequiredString } from './configUtils';

const jsonConfig = JSON.parse(
	readFileSync('./config.json').toString()
) as Record<string, unknown>;

/**
 * Typed config values derived from config.json
 */
const config = {
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	OIDC_CERTS_URL: getRequiredString(jsonConfig, 'OIDC_CERTS_URL'),
	FKSDB_API_URL: getRequiredString(jsonConfig, 'FKSDB_API_URL'),
	FKSDB_LOGIN: getRequiredString(jsonConfig, 'FKSDB_LOGIN'),
	FKSDB_PASSWORD: getRequiredString(jsonConfig, 'FKSDB_PASSWORD'),
};

export default config;
