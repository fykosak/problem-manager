import { readFileSync } from 'fs';
import { ConfigError, getRequiredString } from './configUtils';

const jsonConfig = JSON.parse(
	readFileSync('./config.json').toString()
) as Record<string, unknown>;

type RoleMapType = Map<string, Set<string>>;

/**
 * Get typed role map from object, for example from
 * ```
 * {
 *   "organizer": ["role"],
 *   "manager": ["secondRole"],
 * }
 * ```
 */
function getRoleMap(json: unknown) {
	if (typeof json !== 'object') {
		throw new ConfigError('Role map must be an object');
	}

	const typedRoleMap: RoleMapType = new Map();

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

	const contestRoleMap = new Map<string, RoleMapType>();
	for (const contest in json) {
		contestRoleMap.set(
			contest,
			getRoleMap((json as Record<string, unknown>)[contest])
		);
	}

	return contestRoleMap;
}

function getACLConfig(json: Record<string, unknown>, property: string) {
	const aclConfig = json[property];
	if (typeof aclConfig !== 'object') {
		throw new ConfigError('Acl config is not an object');
	}

	const roleMap: {
		baseRole: RoleMapType | null;
		contestRole: Map<string, RoleMapType> | null;
	} = {
		baseRole: null,
		contestRole: null,
	};

	for (const roleScope in aclConfig) {
		if (roleScope === 'baseRole') {
			roleMap.baseRole = getRoleMap(
				(aclConfig as Record<string, unknown>)[roleScope]
			);
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
	roles: getACLConfig(jsonConfig, 'roles'),
};

export default config;
