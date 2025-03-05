import { TRPCError } from '@trpc/server';
import { trpc } from './trpc';
import { z } from 'zod';
import { db } from '@server/db';
import { eq } from 'drizzle-orm';
import { contestTable, personTable } from '@server/db/schema';

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

	// TODO get user from database
	const person = await db.query.personTable.findFirst({
		where: eq(personTable.personId, Number(ctx.jwtData['person_id'])),
		with: { organizers: true },
	});

	if (!person) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
		});
	}

	return next({
		ctx: {
			person: person,
		},
	});
});

export const contestProcedure = authedProcedure
	.input(z.object({ contestId: z.number() }))
	.use(async ({ input, ctx, next }) => {
		const contest = await db.query.contestTable.findFirst({
			where: eq(contestTable.contestId, input.contestId),
		});

		if (!contest) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Contest not found',
			});
		}

		function isPersonOrganizer() {
			for (const organizer of ctx.person.organizers) {
				if (organizer.contestId === input.contestId) {
					return true;
				}
			}
			return false;
		}

		if (!isPersonOrganizer()) {
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
