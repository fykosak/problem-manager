import { AclError } from './aclError';
import { type AssertionType, Role } from './role';
import type { PersonRoles } from './roleTypes';

export class ACL {
	roles = new Map<string, Role>();

	public static readonly All = null;

	private getRole(roleName: string): Role {
		const role = this.roles.get(roleName);

		if (!role) {
			throw new AclError(`Role ${roleName} does not exist`);
		}

		return role;
	}

	public addRole(
		roleName: string,
		inheritsFrom: string | string[] = []
	): void {
		if (this.roles.has(roleName)) {
			throw new AclError(`Role ${roleName} already exists`);
		}

		if (!Array.isArray(inheritsFrom)) {
			inheritsFrom = [inheritsFrom];
		}

		for (const inheritsFromRoleName of inheritsFrom) {
			// try to get inherited role to check if it exists
			this.getRole(inheritsFromRoleName);
		}

		this.roles.set(roleName, new Role(inheritsFrom));
	}

	public allow(
		roleName: string,
		resourceName: string | typeof ACL.All = ACL.All,
		actionName: string | typeof ACL.All = ACL.All,
		assertion: AssertionType = true
	): void {
		const role = this.getRole(roleName);
		role.allow(resourceName, actionName, assertion);
	}

	/**
	 * Check if role `roleName` is allowed access to resource.
	 * If `roleName` is a list, search if any role from the list is allowed.
	 */
	public isAllowed(
		roleNames: string | string[],
		resourceName: string,
		actionName: string | typeof ACL.All = ACL.All,
		assertionData?: unknown
	): boolean {
		if (!Array.isArray(roleNames)) {
			roleNames = [roleNames];
		}

		// BFS through roles
		// works because Set in guaranteed to have elements in the order of
		// insertion

		// list of role names waiting to be checked
		let toVisit = new Set<string>(roleNames);
		// list of "seen" role names, that were already visited or are waiting
		// to be visited, these should not be added to the visit list again
		let seen = new Set<string>(roleNames);

		while (toVisit.size > 0) {
			const roleName = toVisit.values().next().value as string;
			const role = this.getRole(roleName);
			if (role.isAllowed(resourceName, actionName, assertionData)) {
				return true;
			}
			const nextRoles = role.inheritsFrom.difference(seen);
			toVisit = toVisit.union(nextRoles);
			seen = seen.union(nextRoles);
			toVisit.delete(roleName);
		}

		return false;
	}

	/**
	 * Check if any role from person's base role list is allowed the given resource.
	 */
	public isAllowedBase(
		personRoles: PersonRoles,
		resourceName: string,
		actionName: string | typeof ACL.All = ACL.All,
		assertionData?: unknown
	) {
		return this.isAllowed(
			Array.from(personRoles.baseRole.values()),
			resourceName,
			actionName,
			assertionData
		);
	}

	/**
	 * Check if person has a permission for a contest.
	 * If not, check also for base roles.
	 */
	public isAllowedContest(
		personRoles: PersonRoles,
		contestSymbol: string,
		resourceName: string,
		actionName: string | typeof ACL.All = ACL.All,
		assertionData?: unknown
	) {
		const contestRoles = personRoles.contestRole.get(contestSymbol);
		if (contestRoles) {
			if (
				this.isAllowed(
					Array.from(contestRoles.values()),
					resourceName,
					actionName,
					assertionData
				)
			) {
				return true;
			}
		}

		return this.isAllowedBase(
			personRoles,
			resourceName,
			actionName,
			assertionData
		);
	}
}
