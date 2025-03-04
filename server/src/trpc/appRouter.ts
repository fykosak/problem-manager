import { z } from 'zod';

import { db } from '@server/db';
import { problemRouter } from './routers/problemRouter';
import { contestRouter } from './routers/contestRouter';
import { personWorkTable } from '@server/db/schema';
import { and, eq } from 'drizzle-orm';
import { trpc } from './trpc';
import { protectedProcedure } from './middleware';

export const appRouter = trpc.router({
	getProblems: protectedProcedure.input(z.number()).query(async () => {
		return await db.query.problemTable.findMany({
			with: {
				problemTopics: {
					with: {
						topic: true,
					},
				},
				type: true,
				authors: {
					with: {
						person: true,
					},
				},
			},
			//where: eq(problemTable, opts.input)
		});
	}),
	getContests: protectedProcedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				years: true,
			},
		});
	}),
	problem: problemRouter,
	contest: contestRouter,
	work: trpc.router({
		updatePersonWork: protectedProcedure
			.input(
				z.object({
					workId: z.number(),
					personId: z.number(),
					assigned: z.boolean(),
				})
			)
			.query(async (opts) => {
				if (opts.input.assigned) {
					await db.insert(personWorkTable).values({
						workId: opts.input.workId,
						personId: opts.input.personId,
					});
				} else {
					await db
						.delete(personWorkTable)
						.where(
							and(
								eq(personWorkTable.workId, opts.input.workId),
								eq(
									personWorkTable.personId,
									opts.input.personId
								)
							)
						);
				}
			}),
	}),
});

export type AppRouter = typeof appRouter;
