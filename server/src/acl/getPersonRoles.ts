import config from '@server/config/config';

import type { PersonRoles, RoleMapping } from './roleTypes';

function filterAssignedRoles(mapping: RoleMapping, tokenRoles: Set<string>) {
	const appliedRoles = new Set<string>();

	for (const [targetRole, mappedRoles] of mapping.entries()) {
		for (const mappedRole of mappedRoles) {
			if (tokenRoles.has(mappedRole)) {
				appliedRoles.add(targetRole);
				break; // skip other mapped roles and continue to next mapping
			}
		}
	}

	return appliedRoles;
}

export function getPersonRoles(tokenRoles: Set<string>) {
	// base roles
	const aclRoles: PersonRoles = {
		baseRole: new Set<string>(),
		contestRole: new Map<string, Set<string>>(),
	};

	if (config.roleMapping.baseRole) {
		aclRoles.baseRole = filterAssignedRoles(
			config.roleMapping.baseRole,
			tokenRoles
		);
	}

	if (config.roleMapping.contestRole) {
		for (const [
			contest,
			contestMapping,
		] of config.roleMapping.contestRole.entries()) {
			aclRoles.contestRole.set(
				contest,
				filterAssignedRoles(contestMapping, tokenRoles)
			);
		}
	}

	return aclRoles;
}
