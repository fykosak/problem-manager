import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@server/db';
import { contestYearTable, personWorkTable } from '@server/db/schema';

import { authedProcedure } from './middleware';
import { contestRouter } from './routers/contestRouter';
import { organizersRouter } from './routers/organizersRouter';
import { personRouter } from './routers/personRouter';
import { problemRouter } from './routers/problemRouter';
import { seriesRouter } from './routers/seriesRouter';
import { textRouter } from './routers/textRouter';
import { workRouter } from './routers/workRouter';
import { trpc } from './trpc';

export const appRouter = trpc.router({
	getContests: authedProcedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				years: {
					orderBy: desc(contestYearTable.year),
				},
			},
		});
	}),
	contest: contestRouter,
	person: personRouter,
	problem: problemRouter,
	series: seriesRouter,
	text: textRouter,
	work: workRouter,
	organizers: organizersRouter,
});

export type AppRouter = typeof appRouter;
