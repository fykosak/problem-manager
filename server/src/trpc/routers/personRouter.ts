import { trpc } from '@server/trpc/trpc';
import { authedProcedure } from '../middleware';
import { db } from '@server/db';
import { and, desc, eq, inArray, not } from 'drizzle-orm';
import {
	contestTable,
	contestYearTable,
	personWorkTable,
	problemTable,
	seriesTable,
	workStateEnum,
	workTable,
} from '@server/db/schema';
import { z } from 'zod';

export const personRouter = trpc.router({
	work: authedProcedure
		.input(z.enum(workStateEnum.enumValues).nullish())
		.query(async ({ ctx, input }) => {
			return await db
				.select()
				.from(workTable)
				.innerJoin(
					personWorkTable,
					eq(personWorkTable.workId, workTable.workId)
				)
				.innerJoin(
					problemTable,
					eq(workTable.problemId, problemTable.problemId)
				)
				.leftJoin(
					seriesTable,
					eq(seriesTable.seriesId, problemTable.seriesId)
				)
				.leftJoin(
					contestYearTable,
					eq(
						contestYearTable.contestYearId,
						seriesTable.contestYearId
					)
				)
				.leftJoin(
					contestTable,
					eq(contestTable.contestId, contestYearTable.contestId)
				)
				.where(
					and(
						eq(personWorkTable.personId, ctx.person.personId),
						input ? eq(workTable.state, input) : undefined
					)
				);
		}),
	/**
	 * Return list of contest years, that are active and person is
	 * organizing them.
	 */
	activeContestYears: authedProcedure.query(async ({ ctx }) => {
		// TODO create logic for active contest year
		// TODO filter by since and until
		const contestIds = ctx.person.organizers.map(
			(organizer) => organizer.contestId
		);

		return await db
			.selectDistinctOn([contestYearTable.contestId])
			.from(contestYearTable)
			.innerJoin(
				contestTable,
				eq(contestTable.contestId, contestYearTable.contestId)
			)
			.where(inArray(contestYearTable.contestId, contestIds))
			.orderBy(contestYearTable.contestId, desc(contestYearTable.year));
	}),
});
