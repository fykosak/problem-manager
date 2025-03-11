import { AclError } from './aclError';
import { Role } from './role';

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

	public addRole(roleName: string): void {
		if (this.roles.has(roleName)) {
			throw new AclError(`Role ${roleName} already exists`);
		}

		this.roles.set(roleName, new Role());
	}

	public allow(
		roleName: string,
		resourceName: string | typeof ACL.All = ACL.All,
		actionName: string | typeof ACL.All = ACL.All
	): void {
		const role = this.getRole(roleName);
		role.allow(resourceName, actionName);
	}

	/**
	 * Check if role `roleName` is allowed access to resource.
	 * If `roleName` is a list, search if any role from the list is allowed.
	 */
	public isAllowed(
		roleNames: string | string[],
		resourceName: string,
		actionName: string | typeof ACL.All = ACL.All
	): boolean {
		if (!Array.isArray(roleNames)) {
			roleNames = [roleNames];
		}

		for (const roleName of roleNames) {
			const role = this.getRole(roleName);
			if (role.isAllowed(resourceName, actionName)) {
				return true;
			}
		}

		return false;
	}
}
