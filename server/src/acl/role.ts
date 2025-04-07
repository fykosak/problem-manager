import { ACL } from './acl';

export type AssertionType = true | ((data: unknown) => boolean);
export type ActionType = string | typeof ACL.All;

export class Role {
	private permissions = new Map<string, Map<ActionType, AssertionType>>();
	private allowedAll = false;

	public readonly inheritsFrom: Set<string>;

	constructor(inheritsFrom: string[]) {
		this.inheritsFrom = new Set(inheritsFrom);
	}

	public allow(
		resourceName: string | typeof ACL.All,
		actionName: string | typeof ACL.All,
		assertion: AssertionType
	): void {
		if (resourceName === ACL.All) {
			this.allowedAll = true;
			return;
		}
		const actionMap = this.permissions.get(resourceName);
		if (!actionMap) {
			const newActionMap = new Map<ActionType, AssertionType>();
			newActionMap.set(actionName, assertion);
			this.permissions.set(resourceName, newActionMap);
			return;
		}

		actionMap.set(actionName, assertion);
	}

	public isAllowed(
		resourceName: string,
		actionName: string | typeof ACL.All,
		assertionData?: unknown
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

		// get action value to determine if it exists and if it's true or an
		// assertion
		const action = actions.get(actionName);

		if (action === undefined) {
			return false;
		}

		if (action === true) {
			return true;
		}

		return action(assertionData);
	}
}
