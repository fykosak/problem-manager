import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { getPersonRoles } from '@server/acl/getPersonRoles';
import { db } from '@server/db';
import { contestTable, personTable } from '@server/db/schema';

import { trpc } from './trpc';

export const authedProcedure = trpc.procedure.use(async ({ ctx, next }) => {
	if (!ctx.jwtData) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	// expect `person_id`
	if (!ctx.jwtData['person_id']) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Cannot get person ID from token',
		});
	}

	const person = await db.query.personTable.findFirst({
		where: eq(personTable.personId, Number(ctx.jwtData['person_id'])),
		with: { organizers: true },
	});

	if (!person) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
		});
	}

	// check roles
	if (
		!ctx.jwtData['realm_access'] ||
		typeof ctx.jwtData['realm_access'] !== 'object'
	) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Cannot get realm_access from token',
		});
	}

	const tokenRoles = (ctx.jwtData['realm_access'] as Record<string, unknown>)[
		'roles'
	];

	if (
		!Array.isArray(tokenRoles) ||
		!tokenRoles.every((role) => typeof role === 'string')
	) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Bad type of roles',
		});
	}

	const aclRoles = getPersonRoles(new Set(tokenRoles));

	return next({
		ctx: {
			person: person,
			aclRoles: aclRoles,
		},
	});
});

export const contestProcedure = authedProcedure
	.input(z.object({ contestSymbol: z.string() }))
	.use(async ({ input, ctx, next }) => {
		const contest = await db.query.contestTable.findFirst({
			where: eq(contestTable.symbol, input.contestSymbol),
		});

		if (!contest) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Contest not found',
			});
		}

		if (
			!acl.isAllowedContest(ctx.aclRoles, input.contestSymbol, 'contest')
		) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You cannot access this contest',
			});
		}

		return next({
			ctx: {
				contest: contest,
			},
		});
	});
