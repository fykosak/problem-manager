import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { ParserInput, latexLanguage } from 'lang-latex';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { HtmlGenerator } from '@server/api/compiler/htmlGenerator';
import { db } from '@server/db';
import { textTable } from '@server/db/schema';
import { StorageProvider } from '@server/sockets/storageProvider';

import { authedProcedure } from '../middleware';
import { trpc } from '../trpc';

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
					'release'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: "You don't have permission to release this text",
				});
			}

			const ydocStorage = new StorageProvider();
			const ydoc = await ydocStorage.getYDoc(input.textId);
			const contents = ydoc.getText().toJSON();

			const parserInput = new ParserInput(contents);
			const tree = latexLanguage.parser.parse(parserInput);

			const generator = new HtmlGenerator(
				tree,
				parserInput,
				text.problemId
			);

			try {
				const html = await generator.generateHtml();
				await db
					.update(textTable)
					.set({ html })
					.where(eq(textTable.textId, input.textId));
			} catch {
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
