import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@server/db';
import { personWorkTable } from '@server/db/schema';

import { authedProcedure } from './middleware';
import { contestRouter } from './routers/contestRouter';
import { personRouter } from './routers/personRouter';
import { problemRouter } from './routers/problemRouter';
import { trpc } from './trpc';

export const appRouter = trpc.router({
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
