import { expect, test } from 'vitest';

import { ACL } from '@server/acl/acl';
import { AclError } from '@server/acl/aclError';

test('basic resource and action', () => {
	const acl = new ACL({
		resource: ['action', 'otherAction'],
	});

	acl.addRole('role');

	acl.allow('role', 'resource', 'action');
	acl.allow('role', 'resource', 'otherAction');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
});

test('not allowed action', () => {
	const acl = new ACL({
		resource: ['action', 'otherAction'],
	});
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(false);
});

test('not allowed resource', () => {
	const acl = new ACL({
		resource: ['action', 'superaction'],
		otherResource: ['action'],
	});
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(false);
});

test('allow all actions', () => {
	const acl = new ACL({
		resource: ['action', 'otherAction'],
		otherResource: ['action'],
	});
	acl.addRole('role');
	acl.allow('role', 'resource');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
	expect(acl.isAllowed('role', 'resource')).toBe(true);

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(false);
});

test('is not allowed all actions', () => {
	const acl = new ACL({
		resource: ['action'],
	});
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource')).toBe(false);
});

test('multiple roles', () => {
	const acl = new ACL({
		resource: ['action', 'otherAction'],
		otherResource: ['action', 'otherAction'],
	});
	acl.addRole('role');
	acl.addRole('otherRole');

	acl.allow('role', 'resource', 'action');
	acl.allow('otherRole', 'otherResource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(false);
	expect(acl.isAllowed('role', 'resource')).toBe(false);

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(false);
	expect(acl.isAllowed('role', 'otherResource', 'otherAction')).toBe(false);
	expect(acl.isAllowed('role', 'otherResource')).toBe(false);

	expect(acl.isAllowed('otherRole', 'resource', 'action')).toBe(false);
	expect(acl.isAllowed('otherRole', 'resource', 'otherAction')).toBe(false);
	expect(acl.isAllowed('otherRole', 'resource')).toBe(false);

	expect(acl.isAllowed('otherRole', 'otherResource', 'action')).toBe(true);
	expect(acl.isAllowed('otherRole', 'otherResource', 'otherAction')).toBe(
		false
	);
	expect(acl.isAllowed('otherRole', 'otherResource')).toBe(false);

	// any role from list
	expect(acl.isAllowed(['role', 'otherRole'], 'resource', 'action')).toBe(
		true
	);
	expect(
		acl.isAllowed(['role', 'otherRole'], 'otherResource', 'action')
	).toBe(true);
});

test('allow all resources', () => {
	const acl = new ACL({
		resource: ['action', 'otherAction'],
		otherResource: ['action', 'otherAction'],
	});
	acl.addRole('role');

	acl.allow('role');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
	expect(acl.isAllowed('role', 'resource')).toBe(true);

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'otherResource', 'otherAction')).toBe(true);
	expect(acl.isAllowed('role', 'otherResource')).toBe(true);
});

test('assertion', () => {
	const acl = new ACL({
		resource: ['action'],
	});
	acl.addRole('role');

	acl.allow('role', 'resource', 'action', (user) => {
		if (!user) {
			throw new AclError('User undefined');
		}
		if (typeof user !== 'object') {
			throw new AclError('User is not an object');
		}
		if (!('isAllowed' in user)) {
			throw new AclError('User does not have an `isAllowed` property');
		}

		if (user.isAllowed === true) {
			return true;
		}

		return false;
	});

	expect(
		acl.isAllowed('role', 'resource', 'action', { isAllowed: true })
	).toBe(true);
	expect(
		acl.isAllowed('role', 'resource', 'action', { isAllowed: false })
	).toBe(false);
	expect(
		acl.isAllowed('role', 'resource', 'action', { isAllowed: 'asdf' })
	).toBe(false);
});

test('role inheritance', () => {
	const acl = new ACL({
		resource: ['action'],
		otherResource: ['action'],
	});
	acl.addRole('inheritedRole');

	acl.allow('inheritedRole', 'resource', 'action');

	acl.addRole('role', 'inheritedRole');
	acl.allow('role', 'otherResource', 'action');

	expect(acl.isAllowed('inheritedRole', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('inheritedRole', 'otherResource', 'action')).toBe(
		false
	);

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(true);
});

test('deeper role inheritance', () => {
	const acl = new ACL({
		resource1: [],
		resource2: [],
		resource3: [],
		resource4: [],
		resource5: [],
	});

	// 5 -> 3 -> 2 -> 1
	//  \      ^
	//   > 4  /
	acl.addRole('1');
	acl.addRole('2', '1');
	acl.addRole('3', '2');
	acl.addRole('4', '2');
	acl.addRole('5', ['3', '4']);

	acl.allow('1', 'resource1');
	acl.allow('2', 'resource2');
	acl.allow('3', 'resource3');
	acl.allow('4', 'resource4');
	acl.allow('5', 'resource5');

	expect(acl.isAllowed('1', 'resource1')).toBe(true);
	expect(acl.isAllowed('1', 'resource2')).toBe(false);
	expect(acl.isAllowed('1', 'resource3')).toBe(false);
	expect(acl.isAllowed('1', 'resource4')).toBe(false);
	expect(acl.isAllowed('1', 'resource5')).toBe(false);

	expect(acl.isAllowed('2', 'resource1')).toBe(true);
	expect(acl.isAllowed('2', 'resource2')).toBe(true);
	expect(acl.isAllowed('2', 'resource3')).toBe(false);
	expect(acl.isAllowed('2', 'resource4')).toBe(false);
	expect(acl.isAllowed('2', 'resource5')).toBe(false);

	expect(acl.isAllowed('3', 'resource1')).toBe(true);
	expect(acl.isAllowed('3', 'resource2')).toBe(true);
	expect(acl.isAllowed('3', 'resource3')).toBe(true);
	expect(acl.isAllowed('3', 'resource4')).toBe(false);
	expect(acl.isAllowed('3', 'resource5')).toBe(false);

	expect(acl.isAllowed('4', 'resource1')).toBe(true);
	expect(acl.isAllowed('4', 'resource2')).toBe(true);
	expect(acl.isAllowed('4', 'resource3')).toBe(false);
	expect(acl.isAllowed('4', 'resource4')).toBe(true);
	expect(acl.isAllowed('4', 'resource5')).toBe(false);

	expect(acl.isAllowed('5', 'resource1')).toBe(true);
	expect(acl.isAllowed('5', 'resource2')).toBe(true);
	expect(acl.isAllowed('5', 'resource3')).toBe(true);
	expect(acl.isAllowed('5', 'resource4')).toBe(true);
	expect(acl.isAllowed('5', 'resource5')).toBe(true);
});

test('inherit from not existing role', () => {
	const acl = new ACL({});
	acl.addRole('inheritedRole');
	expect(() => acl.addRole('role', 'otherRole')).toThrowError(AclError);
});
