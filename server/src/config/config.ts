import { readFileSync } from 'fs';
import { z } from 'zod';

import { langEnum, textTypeEnum } from '@server/db/schema';

import { ConfigError, getRequiredString } from './configUtils';
import { getACLConfig } from './roles';
import { getWorkConfig } from './work';

const jsonConfig = JSON.parse(
	readFileSync('./config.json').toString()
) as Record<string, unknown>;

const contestTextsSchema = z.record(
	z.string().nonempty(),
	z.record(
		z.enum(textTypeEnum.enumValues),
		z.enum(langEnum.enumValues).array()
	)
);

/**
 * Get list of used texts and languages for a contest
 */
function getContestTexts(json: Record<string, unknown>, property: string) {
	const textsConfig = json[property];
	if (!textsConfig || typeof textsConfig !== 'object') {
		throw new ConfigError('Texts config is not an object');
	}

	return contestTextsSchema.parse(textsConfig);
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
	contestTexts: getContestTexts(jsonConfig, 'contestTexts'),
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
