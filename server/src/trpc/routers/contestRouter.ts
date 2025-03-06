import { trpc } from '@server/trpc/trpc';

import { db } from '@server/db';

import { and, eq } from 'drizzle-orm';
import { organizerTable, topicTable, typeTable } from '@server/db/schema';
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
});
