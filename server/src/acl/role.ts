import { ACL } from './acl';

// TODO support actions and assertions
export class Role {
	private permissions = new Map<string, Set<string | typeof ACL.All>>();
	private allowedAll = false;

	public allow(
		resourceName: string | typeof ACL.All,
		actionName: string | typeof ACL.All
	): void {
		if (resourceName === ACL.All) {
			this.allowedAll = true;
			return;
		}
		const actionSet = this.permissions.get(resourceName);
		if (!actionSet) {
			this.permissions.set(resourceName, new Set([actionName]));
			return;
		}

		actionSet.add(actionName);
	}

	public isAllowed(
		resourceName: string,
		actionName: string | typeof ACL.All
	): boolean {
		if (this.allowedAll) {
			return true;
		}

		const actions = this.permissions.get(resourceName);
		if (!actions) {
			return false;
		}

		if (actions.has(ACL.All)) {
			return true;
		}

		return actions.has(actionName);
	}
}
