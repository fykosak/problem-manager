import { readFileSync } from 'fs';

import { BaseRole, ContestRole, type RoleMapping } from './acl/roleTypes';
import { ConfigError, getRequiredString } from './configUtils';

const jsonConfig = JSON.parse(
	readFileSync('./config.json').toString()
) as Record<string, unknown>;

/**
 * Get typed role map from object, for example from
 * ```
 * {
 *   "organizer": ["role"],
 *   "manager": ["secondRole"],
 * }
 * ```
 */
function getRoleMappping(json: unknown) {
	if (typeof json !== 'object') {
		throw new ConfigError('Role map must be an object');
	}

	const typedRoleMap: RoleMapping = new Map();

	for (const role in json) {
		const mappedRoles = (json as Record<string, unknown>)[role];
		if (!Array.isArray(mappedRoles)) {
			throw new ConfigError(`Mapped roles for ${role} must be an array`);
		}
		if (
			!mappedRoles.every((mappedRole) => typeof mappedRole === 'string')
		) {
			throw new ConfigError(
				`List of mapped roles for role ${role} must be an array of strings`
			);
		}

		typedRoleMap.set(role, new Set(mappedRoles));
	}

	return typedRoleMap;
}

function getContestRoleMap(json: unknown) {
	if (typeof json !== 'object') {
		throw new ConfigError('Role map must be an object');
	}

	const contestRoleMap = new Map<string, RoleMapping>();
	for (const contest in json) {
		const roleMapping = getRoleMappping(
			(json as Record<string, unknown>)[contest]
		);

		for (const role of roleMapping.keys()) {
			// JS does not support enums and it is just a TS feature, so this
			// won't be pretty
			if (!(Object.values(ContestRole) as string[]).includes(role)) {
				throw new ConfigError(`Role ${role} is not a contest role`);
			}
		}

		contestRoleMap.set(contest, roleMapping);
	}

	return contestRoleMap;
}

function getACLConfig(json: Record<string, unknown>, property: string) {
	const aclConfig = json[property];
	if (typeof aclConfig !== 'object') {
		throw new ConfigError('Acl config is not an object');
	}

	const roleMap: {
		baseRole: RoleMapping | null;
		contestRole: Map<string, RoleMapping> | null;
	} = {
		baseRole: null,
		contestRole: null,
	};

	for (const roleScope in aclConfig) {
		if (roleScope === 'baseRole') {
			const roleMapping = getRoleMappping(
				(aclConfig as Record<string, unknown>)[roleScope]
			);
			for (const role of roleMapping.keys()) {
				if (!(Object.values(BaseRole) as string[]).includes(role)) {
					throw new ConfigError(`Role ${role} is not a base role`);
				}
			}
			roleMap.baseRole = roleMapping;
			continue;
		}
		if (roleScope === 'contestRole') {
			roleMap.contestRole = getContestRoleMap(
				(aclConfig as Record<string, unknown>)[roleScope]
			);
			continue;
		}

		throw new ConfigError(`Unrecognized scope ${roleScope} in acl config`);
	}

	return roleMap;
}

/**
 * Typed config values derived from config.json
 */
const config = {
	/** URL to oidc realm certs, for example https://mykeycloak.example.com/realms/master/protocol/openid-connect/certs */
	oidcCertsUrl: getRequiredString(jsonConfig, 'oidcCertsUrl'),
	fksdbApiUrl: getRequiredString(jsonConfig, 'fksdbApiUrl'),
	fksdbLogin: getRequiredString(jsonConfig, 'fksdbLogin'),
	fksdbPassword: getRequiredString(jsonConfig, 'fksdbPassword'),
	roleMapping: getACLConfig(jsonConfig, 'roleMapping'),
};

export default config;
