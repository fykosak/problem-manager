import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { getPersonFromJWT, getRolesFromJWT } from '@server/auth/jwt';
import { db } from '@server/db';
import { contestTable } from '@server/db/schema';

import { trpc } from './trpc';

export const authedProcedure = trpc.procedure.use(async ({ ctx, next }) => {
	if (!ctx.jwtData) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	const person = await getPersonFromJWT(ctx.jwtData);
	if (!person) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
		});
	}

	const aclRoles = getRolesFromJWT(ctx.jwtData);
	if (!aclRoles) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
		});
	}

	return next({
		ctx: {
			person,
			aclRoles,
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
