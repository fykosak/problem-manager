import { TRPCError } from '@trpc/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import config from '@server/config/config';
import { db } from '@server/db';
import {
	contestTable,
	contestYearTable,
	organizerTable,
	problemTable,
	topicTable,
	typeTable,
} from '@server/db/schema';
import { trpc } from '@server/trpc/trpc';

import { authedProcedure, contestProcedure } from '../middleware';

export const contestRouter = trpc.router({
	// TODO filter by organizer contests
	createProblemData: authedProcedure.query(async () => {
		const contests = await db.query.contestTable.findMany({
			with: {
				topics: true,
				types: true,
			},
		});
		return {
			contests,
			contestTexts: config.contestTexts,
			contestMetadataFields: config.contestMetadataFields,
		};
	}),

	contestYear: contestProcedure
		.input(z.object({ contestYear: z.number() }))
		.query(async ({ ctx, input }) => {
			const contestYear = await db.query.contestYearTable.findFirst({
				where: and(
					eq(contestYearTable.year, input.contestYear),
					eq(contestYearTable.contestId, ctx.contest.contestId)
				),
				with: {
					contest: true,
				},
			});
			if (!contestYear) {
				throw new TRPCError({
					message: 'Context year not found',
					code: 'NOT_FOUND',
				});
			}
			return contestYear;
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

	topics: contestProcedure.query(async ({ ctx }) => {
		const data = await db.query.topicTable.findMany({
			where: eq(topicTable.contestId, ctx.contest.contestId),
			orderBy: [topicTable.topicId],
		});
		return data;
	}),

	types: contestProcedure.query(async ({ ctx }) => {
		return await db.query.typeTable.findMany({
			where: eq(typeTable.contestId, ctx.contest.contestId),
			orderBy: [typeTable.typeId],
		});
	}),

	availableWork: contestProcedure.query(({ ctx }) => {
		return config.contestWork[ctx.contest.symbol];
	}),

	organizers: contestProcedure.query(async ({ ctx }) => {
		let contestId = ctx.contest.contestId;
		if (ctx.contest.symbol in config.organizerMapping) {
			const mappedSymbol = config.organizerMapping[ctx.contest.symbol];
			const mappedContest = await db.query.contestTable.findFirst({
				where: eq(contestTable.symbol, mappedSymbol),
			});
			if (!mappedContest) {
				throw new TRPCError({
					message: 'Mapped contest does not exist',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
			contestId = mappedContest.contestId;
		}

		return await db.query.organizerTable.findMany({
			where: eq(organizerTable.contestId, contestId),
			with: { person: true },
		});
	}),

	metadataFields: contestProcedure.query(({ ctx }) => {
		return config.contestMetadataFields[ctx.contest.symbol] ?? [];
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
			orderBy: desc(problemTable.problemId),
		});
	}),
});
