import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import { z } from 'zod';

import { db } from '@server/db';
import {
	apiKeyTable,
	contestTable,
	contestYearTable,
	personWorkTable,
	problemTable,
	seriesTable,
	workStateEnum,
	workTable,
} from '@server/db/schema';
import { trpc } from '@server/trpc/trpc';

import { authedProcedure } from '../middleware';

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
					eq(
						contestTable.contestId,
						sql`COALESCE(${contestYearTable.contestId}, ${problemTable.contestId})`
					)
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
	//activeContestYears: authedProcedure.query(async ({ ctx }) => {
	//	// TODO create logic for active contest year
	//	// TODO filter by since and until
	//	const contestIds = ctx.person.organizers.map(
	//		(organizer) => organizer.contestId
	//	);

	//	return await db
	//		.selectDistinctOn([contestYearTable.contestId])
	//		.from(contestYearTable)
	//		.innerJoin(
	//			contestTable,
	//			eq(contestTable.contestId, contestYearTable.contestId)
	//		)
	//		.where(inArray(contestYearTable.contestId, contestIds))
	//		.orderBy(contestYearTable.contestId, desc(contestYearTable.year));
	//}),

	roles: authedProcedure.query(({ ctx }) => {
		// Map and Set cannot be serialized and must be converted to arrays and objects
		const contestRolesMap = new Map<string, string[]>();

		for (const [key, value] of ctx.aclRoles.contestRole.entries()) {
			contestRolesMap.set(key, [...value.values()]);
		}

		// serialize
		return {
			baseRole: [...ctx.aclRoles.baseRole.values()],
			contestRole: Object.fromEntries(contestRolesMap),
		};
	}),

	apiKey: trpc.router({
		list: authedProcedure.query(async ({ ctx }) => {
			return await db.query.apiKeyTable.findMany({
				where: eq(apiKeyTable.personId, ctx.person.personId),
				orderBy: desc(apiKeyTable.created),
			});
		}),

		create: authedProcedure
			.input(
				z.object({
					validUntil: z.coerce.date().nullable(),
				})
			)
			.mutation(async ({ ctx, input }) => {
				do {
					// 48 bytes corresponds to 64 chars in base64
					const key = crypto.randomBytes(48).toString('base64');

					// check if generated key already exists to prevent duplicates
					const existingKey = await db.query.apiKeyTable.findFirst({
						where: eq(apiKeyTable.key, key),
					});
					if (!existingKey) {
						await db.insert(apiKeyTable).values({
							personId: ctx.person.personId,
							key: key,
							validUntil: input.validUntil,
						});
						break;
					}
				} while (true); // eslint-disable-line
			}),

		invalidate: authedProcedure
			.input(
				z.object({
					apiKeyId: z.number(),
				})
			)
			.mutation(async ({ ctx, input }) => {
				const apiKey = await db.query.apiKeyTable.findFirst({
					where: eq(apiKeyTable.apiKeyId, input.apiKeyId),
				});

				if (!apiKey || apiKey.personId !== ctx.person.personId) {
					throw new TRPCError({
						message: 'Cannot invalidate the API key',
						code: 'FORBIDDEN',
					});
				}

				if (apiKey.validUntil && apiKey.validUntil < new Date()) {
					throw new TRPCError({
						message: 'API key already invalid',
						code: 'BAD_REQUEST',
					});
				}

				await db
					.update(apiKeyTable)
					.set({
						validUntil: new Date(),
					})
					.where(eq(apiKeyTable.apiKeyId, input.apiKeyId));
			}),
	}),
});
