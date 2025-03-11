import { ACL } from '@server/acl/acl';
import { AclError } from '@server/acl/aclError';
import { expect, test } from 'vitest';

test('basic resource and action', () => {
	const acl = new ACL();

	acl.addRole('role');

	acl.allow('role', 'resource', 'action');
	acl.allow('role', 'resource', 'otherAction');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
});

test('not allowed action', () => {
	const acl = new ACL();
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(false);
});

test('not allowed resource', () => {
	const acl = new ACL();
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(false);
});

test('allow all actions', () => {
	const acl = new ACL();
	acl.addRole('role');
	acl.allow('role', 'resource');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
	expect(acl.isAllowed('role', 'resource')).toBe(true);

	expect(acl.isAllowed('role', 'otherResource', 'action')).toBe(false);
});

test('is not allowed all actions', () => {
	const acl = new ACL();
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource')).toBe(false);
});

test('multiple roles', () => {
	const acl = new ACL();
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
});

test('allow all resources', () => {
	const acl = new ACL();
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
	const acl = new ACL();
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
