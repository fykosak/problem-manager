import { readFileSync } from 'fs';
import { z } from 'zod';

import { ConfigError, getRequiredString } from './configUtils';
import { getACLConfig } from './roles';
import { getWorkConfig } from './work';

const jsonConfig = JSON.parse(
	readFileSync('./config.json').toString()
) as Record<string, unknown>;

/**
 * Get list of used languages of texts for a contest
 */
function getContestTextLangs(json: Record<string, unknown>, property: string) {
	const textsConfig = json[property];
	if (!textsConfig || typeof textsConfig !== 'object') {
		throw new ConfigError('Texts config is not an object');
	}

	const contestTextLangs = new Map<string, string[]>();

	for (const contest in textsConfig) {
		const langList = (textsConfig as Record<string, unknown>)[contest];
		if (!Array.isArray(langList)) {
			throw new ConfigError(`Language list for ${contest} is not a list`);
		}

		const langs = new Set<string>();
		for (const lang of langList) {
			if (typeof lang !== 'string') {
				throw new ConfigError(
					`Language list should be a list of strings`
				);
			}
			if (lang !== 'cs' && lang !== 'en') {
				throw new ConfigError(
					`Invalid language ${lang}, use only cs,en`
				);
			}
			langs.add(lang);
		}

		contestTextLangs.set(contest, Array.from(langs));
	}

	return contestTextLangs;
}

const organizerMappingSchema = z.record(
	z.string().nonempty(),
	z.string().nonempty()
);

function getOrganizerMapping(json: Record<string, unknown>, property: string) {
	const organizerMapping = json[property];
	if (typeof organizerMapping !== 'object') {
		throw new ConfigError('Organizer mapping config is not an object');
	}

	return organizerMappingSchema.parse(organizerMapping);
}

const contestMetadataFieldsSchema = z.record(
	z.string().nonempty(),
	z.enum(['name', 'origin', 'points', 'result']).array()
);

function getContestMetadataFields(
	json: Record<string, unknown>,
	property: string
) {
	const contestMetadataFields = json[property];
	if (typeof contestMetadataFields !== 'object') {
		throw new ConfigError(
			'Contest metadata fields config is not an object'
		);
	}

	return contestMetadataFieldsSchema.parse(contestMetadataFields);
}

/**
 * Typed config values derived from config.json
 */
const config = {
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	oidcCertsUrl: getRequiredString(jsonConfig, 'oidcCertsUrl'),
	builderUrl: getRequiredString(jsonConfig, 'builderUrl'),
	fksdbApiUrl: getRequiredString(jsonConfig, 'fksdbApiUrl'),
	fksdbLogin: getRequiredString(jsonConfig, 'fksdbLogin'),
	fksdbPassword: getRequiredString(jsonConfig, 'fksdbPassword'),
	dbConnection: getRequiredString(jsonConfig, 'dbConnection'),
	contestTextLangs: getContestTextLangs(jsonConfig, 'contestTextLangs'),
	/**
	 * Allows to map organizers of one contest to another if they're the same.
	 * Key-value pairs of <`original contestSymbol`>: <`mapped contestSymbol`>
	 */
	organizerMapping: getOrganizerMapping(jsonConfig, 'organizerMapping'),
	roleMapping: getACLConfig(jsonConfig, 'roleMapping'),
	/**
	 * List of metadata fields that should be accessible for given contest symbol
	 */
	contestMetadataFields: getContestMetadataFields(
		jsonConfig,
		'contestMetadataFields'
	),
	contestWork: getWorkConfig(jsonConfig, 'contestWork'),
};

export default config;
