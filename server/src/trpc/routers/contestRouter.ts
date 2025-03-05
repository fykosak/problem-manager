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
	availableTopics: contestProcedure.query(async ({ input }) => {
		return await db.query.topicTable.findMany({
			where: and(
				eq(topicTable.contestId, input.contestId),
				eq(topicTable.available, true)
			),
		});
	}),
	availableTypes: contestProcedure.query(async ({ input }) => {
		return await db.query.typeTable.findMany({
			where: and(
				eq(typeTable.contestId, input.contestId),
				eq(typeTable.available, true)
			),
		});
	}),
	organizers: contestProcedure.query(async ({ input }) => {
		return await db.query.organizerTable.findMany({
			where: eq(organizerTable.contestId, input.contestId),
			with: { person: true },
		});
	}),
});
