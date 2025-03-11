import { trpc } from '@server/trpc/trpc';

import { db } from '@server/db';

import { and, desc, eq } from 'drizzle-orm';
import {
	contestTable,
	contestYearTable,
	organizerTable,
	problemTable,
	topicTable,
	typeTable,
} from '@server/db/schema';
import { authedProcedure, contestProcedure } from '../middleware';

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
});
