import { z } from 'zod';

import { db } from '@server/db';
import { problemRouter } from './routers/problemRouter';
import { contestRouter } from './routers/contestRouter';
import { personWorkTable } from '@server/db/schema';
import { and, eq } from 'drizzle-orm';
import { trpc } from './trpc';
import { authedProcedure } from './middleware';
import { personRouter } from './routers/personRouter';

export const appRouter = trpc.router({
	getProblems: authedProcedure.input(z.number()).query(async () => {
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
	getContests: authedProcedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				years: true,
			},
		});
	}),
	contest: contestRouter,
	person: personRouter,
	problem: problemRouter,
	work: trpc.router({
		updatePersonWork: authedProcedure
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
