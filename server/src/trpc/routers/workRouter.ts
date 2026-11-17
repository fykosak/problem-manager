import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { db } from '@server/db';
import { personWorkTable, workStateEnum, workTable } from '@server/db/schema';
import { ProblemModel } from '@server/problem/problemModel';

import { authedProcedure } from '../middleware';
import { trpc } from '../trpc';

export const workRouter = trpc.router({
	updatePersonWork: authedProcedure
		.input(
			z.object({
				workId: z.number(),
				personId: z.number(),
				assigned: z.boolean(),
			})
		)
		.query(async ({ input, ctx }) => {
			const work = await db.query.workTable.findFirst({
				where: eq(workTable.workId, input.workId),
				with: {
					problem: true,
				},
			});

			if (!work) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Work not found',
				});
			}

			const contest = await new ProblemModel(
				db,
				work.problem.problemId
			).getContest();

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					contest.symbol,
					'work',
					'update'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You cannot change this work',
				});
			}

			if (input.assigned) {
				await db.insert(personWorkTable).values({
					workId: input.workId,
					personId: input.personId,
				});
			} else {
				await db
					.delete(personWorkTable)
					.where(
						and(
							eq(personWorkTable.workId, input.workId),
							eq(personWorkTable.personId, input.personId)
						)
					);
			}
		}),

	updateWorkState: authedProcedure
		.input(
			z.object({
				workId: z.number(),
				state: z.enum(workStateEnum.enumValues),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const work = await db.query.workTable.findFirst({
				where: eq(workTable.workId, input.workId),
				with: {
					problem: true,
				},
			});

			if (!work) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Work not found',
				});
			}

			const contest = await new ProblemModel(
				db,
				work.problem.problemId
			).getContest();

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					contest.symbol,
					'work',
					'update'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You cannot change this work',
				});
			}

			const updatedWork = await db
				.update(workTable)
				.set({
					state: input.state,
				})
				.where(eq(workTable.workId, input.workId))
				.returning();

			return updatedWork;
		}),
});
