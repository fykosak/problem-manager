import { trpc } from '@server/trpc/trpc';

import { z } from 'zod';
import { db } from '@server/db';

import { and, eq } from 'drizzle-orm';
import { topicTable, typeTable } from '@server/db/schema';
import { protectedProcedure } from '../middleware';

export const contestRouter = trpc.router({
	// TODO filter by organizer contests
	createProblemData: protectedProcedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				topics: true,
				types: true,
			},
		});
	}),
	availableTopics: protectedProcedure
		.input(z.number())
		.query(async (opts) => {
			return await db.query.topicTable.findMany({
				where: and(
					eq(topicTable.contestId, opts.input),
					eq(topicTable.available, true)
				),
			});
		}),
	availableTypes: protectedProcedure.input(z.number()).query(async (opts) => {
		return await db.query.typeTable.findMany({
			where: and(
				eq(typeTable.contestId, opts.input),
				eq(typeTable.available, true)
			),
		});
	}),
	people: protectedProcedure.input(z.number()).query(async () => {
		// TODO filter by contest organizer
		return await db.query.personTable.findMany();
	}),
});
