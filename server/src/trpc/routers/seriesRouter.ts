import { TRPCError } from '@trpc/server';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { db } from '@server/db';
import { contestYearTable, problemTable, seriesTable } from '@server/db/schema';
import { trpc } from '@server/trpc/trpc';

import { authedProcedure, contestProcedure } from '../middleware';

export const seriesRouter = trpc.router({
	list: contestProcedure
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
						orderBy: [asc(problemTable.seriesOrder)],
					},
					contestYear: {
						with: { contest: true },
					},
				},
				where: inArray(
					seriesTable.contestYearId,
					contestYears.map((contestYear) => contestYear.contestYearId)
				),
				orderBy: asc(seriesTable.seriesId),
			});
		}),

	get: authedProcedure
		.input(
			z.object({
				seriesId: z.number(),
			})
		)
		.query(async ({ input }) => {
			const series = await db.query.seriesTable.findFirst({
				where: eq(seriesTable.seriesId, input.seriesId),
			});
			if (!series) {
				throw new TRPCError({
					message: 'Series does not exist',
					code: 'BAD_REQUEST',
				});
			}
			return series;
		}),

	// TODO check permissions
	// TODO validate data for contest year
	ordering: authedProcedure
		.input(
			z.object({
				series: z.record(z.coerce.number(), z.array(z.number())),
			})
		)
		.mutation(async ({ input }) => {
			for (const seriesId in input.series) {
				for (const [index, problemId] of input.series[
					seriesId
				].entries()) {
					await db
						.update(problemTable)
						.set({
							seriesId: Number(seriesId),
							seriesOrder: index + 1, // order the problems
						})
						.where(eq(problemTable.problemId, problemId));
				}
			}
		}),

	create: contestProcedure
		.input(
			z.object({
				contestYear: z.number(),
				label: z.string().nonempty(),
				release: z.coerce.date().optional(),
				deadline: z.coerce.date().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const contestYear = await db.query.contestYearTable.findFirst({
				where: and(
					eq(contestYearTable.contestId, ctx.contest.contestId),
					eq(contestYearTable.year, input.contestYear)
				),
			});
			if (!contestYear) {
				throw new TRPCError({
					message: 'Contest year does not exist',
					code: 'BAD_REQUEST',
				});
			}
			await db.insert(seriesTable).values({
				contestYearId: contestYear.contestYearId,
				label: input.label,
				release: input.release,
				deadline: input.deadline,
			});
		}),

	edit: authedProcedure
		.input(
			z.object({
				seriesId: z.number(),
				label: z.string().nonempty(),
				release: z.coerce.date().optional(),
				deadline: z.coerce.date().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const series = await db.query.seriesTable.findFirst({
				where: and(eq(seriesTable.seriesId, input.seriesId)),
				with: {
					contestYear: {
						with: {
							contest: true,
						},
					},
				},
			});

			if (!series) {
				throw new TRPCError({
					message: 'Series does not exist',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					series.contestYear.contest.symbol,
					'series',
					'edit'
				)
			) {
				throw new TRPCError({
					message: 'Cannot edit this series',
					code: 'FORBIDDEN',
				});
			}

			await db
				.update(seriesTable)
				.set({
					label: input.label,
					release: input.release,
					deadline: input.deadline,
				})
				.where(eq(seriesTable.seriesId, input.seriesId));
		}),
});
