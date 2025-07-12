import { eq } from 'drizzle-orm';
import { type JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose';

import { getPersonRoles } from '@server/acl/getPersonRoles';
import config from '@server/config/config';
import { db } from '@server/db';
import { personTable } from '@server/db/schema';

export async function getJWTFromHeader(authorization: string) {
	const [authType, accessToken] = authorization.split(' ');
	if (authType != 'Bearer') {
		return null;
	}

	const jwks = createRemoteJWKSet(new URL(config.oidcCertsUrl));
	try {
		const { payload } = await jwtVerify(accessToken, jwks);
		return payload;
	} catch {
		return null;
	}
}

export async function getPersonFromJWT(jwt: JWTPayload) {
	if (!jwt['person_id']) {
		return null;
	}

	const person = await db.query.personTable.findFirst({
		where: eq(personTable.personId, Number(jwt['person_id'])),
		with: { organizers: true },
	});

	if (!person) {
		return null;
	}

	return person;
}

export function getRolesFromJWT(jwt: JWTPayload) {
	if (!jwt['realm_access'] || typeof jwt['realm_access'] !== 'object') {
		return null;
	}

	const tokenRoles = (jwt['realm_access'] as Record<string, unknown>)[
		'roles'
	];

	if (
		!Array.isArray(tokenRoles) ||
		!tokenRoles.every((role) => typeof role === 'string')
	) {
		return null;
	}

	const aclRoles = getPersonRoles(new Set(tokenRoles));

	return aclRoles;
}
