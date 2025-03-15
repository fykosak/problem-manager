import { trpc } from '@server/trpc/trpc';

import { db } from '@server/db';

import { and, desc, eq, inArray } from 'drizzle-orm';
import {
	contestTable,
	contestYearTable,
	organizerTable,
	problemTable,
	seriesTable,
	topicTable,
	typeTable,
} from '@server/db/schema';
import { authedProcedure, contestProcedure } from '../middleware';
import { z } from 'zod';

export const contestRouter = trpc.router({
	// TODO filter by organizer contests
	createProblemData: authedProcedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				topics: true,
				types: true,
			},
		});
	}),
	/**
	 * All contests with their active contest years
	 */
	currentContests: authedProcedure.query(async () => {
		return await db
			.selectDistinctOn([contestYearTable.contestId])
			.from(contestYearTable)
			.innerJoin(
				contestTable,
				eq(contestTable.contestId, contestYearTable.contestId)
			)
			.orderBy(contestYearTable.contestId, desc(contestYearTable.year));
	}),
	availableTopics: contestProcedure.query(async ({ ctx }) => {
		return await db.query.topicTable.findMany({
			where: and(
				eq(topicTable.contestId, ctx.contest.contestId),
				eq(topicTable.available, true)
			),
		});
	}),
	availableTypes: contestProcedure.query(async ({ ctx }) => {
		return await db.query.typeTable.findMany({
			where: and(
				eq(typeTable.contestId, ctx.contest.contestId),
				eq(typeTable.available, true)
			),
		});
	}),
	organizers: contestProcedure.query(async ({ ctx }) => {
		return await db.query.organizerTable.findMany({
			where: eq(organizerTable.contestId, ctx.contest.contestId),
			with: { person: true },
		});
	}),
	problemSuggestions: contestProcedure.query(async ({ ctx }) => {
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
			where: eq(problemTable.contestId, ctx.contest.contestId),
		});
	}),
	// TODO to separate router
	series: contestProcedure
		.input(
			z.object({
				contestYear: z.number(),
			})
		)
		.query(async ({ ctx, input }) => {
			const contestYears = await db.query.contestYearTable.findMany({
				where: and(
					eq(contestYearTable.year, input.contestYear),
					eq(contestYearTable.contestId, ctx.contest.contestId)
				),
			});
			return await db.query.seriesTable.findMany({
				with: {
					problems: {
						with: {
							type: true,
							work: {
								columns: {
									state: true,
								},
							},
						},
					},
				},
				where: inArray(
					seriesTable.contestYearId,
					contestYears.map((contestYear) => contestYear.contestYearId)
				),
			});
		}),
	// TODO to separate router
	// TODO check permissions
	// TODO validate data for contest year
	saveSeriesOrdering: authedProcedure
		.input(
			z.object({
				series: z.record(z.coerce.number(), z.array(z.number())),
			})
		)
		// TODO order task, not just save it's series
		.mutation(async ({ input }) => {
			for (const seriesId in input.series) {
				for (const problemId of input.series[seriesId]) {
					await db
						.update(problemTable)
						.set({ seriesId: Number(seriesId) })
						.where(eq(problemTable.problemId, problemId));
				}
			}
		}),
});
