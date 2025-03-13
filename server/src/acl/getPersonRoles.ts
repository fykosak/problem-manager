import config from '@server/config';
import type { PersonRoles, RoleMapping } from './roleTypes';

function filterAssignedRoles(mapping: RoleMapping, tokenRoles: Set<string>) {
	const appliedRoles = new Set<string>();

	for (const [targetRole, mappedRoles] of mapping.entries()) {
		if (mappedRoles.intersection(tokenRoles).size > 0) {
			appliedRoles.add(targetRole);
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
