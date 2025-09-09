import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { db } from '@server/db';
import { textTable } from '@server/db/schema';

import { authedProcedure } from '../middleware';
import { trpc } from '../trpc';
import { releaseText } from './text';

export const textRouter = trpc.router({
	release: authedProcedure
		.input(
			z.object({
				textId: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const text = await db.query.textTable.findFirst({
				where: eq(textTable.textId, input.textId),
				with: {
					problem: {
						with: {
							series: {
								with: {
									contestYear: {
										with: {
											contest: true,
										},
									},
								},
							},
							contest: true,
						},
					},
				},
			});

			if (!text) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Text not found',
				});
			}

			const contestSymbol = text.problem.series
				? text.problem.series.contestYear.contest.symbol
				: text.problem.contest?.symbol;
			if (!contestSymbol) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Cannot infer contest',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					contestSymbol,
					'text',
					'release'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: "You don't have permission to release this text",
				});
			}

			try {
				await releaseText(input.textId);
			} catch (error) {
				console.error(error);
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to generate HTML',
				});
			}
		}),

	revoke: authedProcedure
		.input(
			z.object({
				textId: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const text = await db.query.textTable.findFirst({
				where: eq(textTable.textId, input.textId),
				with: {
					problem: {
						with: {
							series: {
								with: {
									contestYear: {
										with: {
											contest: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!text) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Text not found',
				});
			}

			if (!text.problem.series) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Problem is not assigned to series',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					text.problem.series.contestYear.contest.symbol,
					'text',
					'revoke'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: "You don't have permission to revoke this text",
				});
			}

			await db
				.update(textTable)
				.set({ html: null })
				.where(eq(textTable.textId, input.textId));
		}),
});
