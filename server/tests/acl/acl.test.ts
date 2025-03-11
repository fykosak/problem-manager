import { ACL } from '@server/acl/acl';
import { expect, test } from 'vitest';

test('basic resource and action', () => {
	const acl = new ACL();

	acl.addRole('role');

	acl.allow('role', 'resource', 'action');
	acl.allow('role', 'resource', 'otherAction');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(true);
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

test('not allowed action', () => {
	const acl = new ACL();
	acl.addRole('role');
	acl.allow('role', 'resource', 'action');

	expect(acl.isAllowed('role', 'resource', 'action')).toBe(true);
	expect(acl.isAllowed('role', 'resource', 'otherAction')).toBe(false);
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
