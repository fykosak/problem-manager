import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { getPersonFromJWT, getRolesFromJWT } from '@server/auth/jwt';
import { db } from '@server/db';
import { contestTable } from '@server/db/schema';
import { PublicError } from '@server/errors/publicError';
import { statusCodeToTRPCCode } from '@server/errors/statusCodes';
import { ProblemModel } from '@server/problem/problemModel';

import { trpc } from './trpc';

/**
 * Catch custom errors and translate them into TRPCErrors
 */
export const errorProcedure = trpc.procedure.use(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		// rethrow TRPCErrors
		if (error instanceof TRPCError) {
			throw error;
		}

		// public errors - send message
		if (error instanceof PublicError) {
			throw new TRPCError({
				code: statusCodeToTRPCCode(error.getStatusCode()),
				message: error.message,
				cause: error,
			});
		}

		// generic error - send a generic message
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			cause: 'Error on the server has occurred',
		});
	}
});

export const authedProcedure = errorProcedure.use(async ({ ctx, next }) => {
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

export const problemProcedure = authedProcedure
	.input(z.object({ problemId: z.number() }))
	.use(async ({ input, ctx, next }) => {
		const problemModel = new ProblemModel(db, input.problemId);
		const contest = await problemModel.getContest();

		if (
			!acl.isAllowedContest(
				ctx.aclRoles,
				contest.symbol,
				'problem',
				'access'
			)
		) {
			throw new TRPCError({
				code: 'FORBIDDEN',
				message: 'You cannot access this contest',
			});
		}

		return next({
			ctx: {
				problemModel: problemModel,
				contest: contest,
			},
		});
	});
