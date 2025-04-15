import { BaseRole, ContestRole, type RoleMapping } from '@server/acl/roleTypes';

import { ConfigError } from './configUtils';

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

/**
 * Get role mappings using `getRoleMappping` for all contests specified
 */
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

/**
 * Read role mappings for ACL from config in defined scopes.
 * - `baseRole` - base roles linked to the whole system, like admin
 * - `contestRole` - roles specific to a contest, i.e. organizer
 */
export function getACLConfig(json: Record<string, unknown>, property: string) {
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
