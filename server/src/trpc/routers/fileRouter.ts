import { TRPCError } from '@trpc/server';
import path from 'node:path';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';

import { problemProcedure } from '../middleware';
import { trpc } from '../trpc';

export const fileRouter = trpc.router({
	list: problemProcedure.query(async ({ input }) => {
		const problemStorage = new ProblemStorage(input.problemId);
		return await problemStorage.getFiles();
	}),

	upload: problemProcedure
		.input(
			z.object({
				problemId: z.number(),
				files: z
					.object({
						name: z.string().nonempty(),
						data: z.string().nonempty(),
					})
					.array(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.contest.symbol,
					'file',
					'upload'
				)
			) {
				throw new TRPCError({
					message: 'Not allowed to upload file',
					code: 'FORBIDDEN',
				});
			}

			// check for name collisions
			const nameSet = new Set<string>();
			for (const file of input.files) {
				const pureName = path.parse(file.name).name;
				if (nameSet.has(pureName)) {
					throw new TRPCError({
						message: `Cannot upload duplicate file ${pureName}`,
						code: 'BAD_REQUEST',
					});
				}
				nameSet.add(pureName);
			}

			const runner = new Runner(input.problemId);
			const problemStorage = new ProblemStorage(input.problemId);

			for (const file of input.files) {
				await problemStorage.saveFile(file.name, file.data);
				const filepath = problemStorage.getPathForFile(file.name);
				try {
					await runner.exportFile(filepath);
				} catch {
					throw new TRPCError({
						message: `Failed to export file ${file.name}`,
						code: 'INTERNAL_SERVER_ERROR',
					});
				}
			}
		}),

	/**
	 * Exports original files as DataURI
	 */
	download: problemProcedure
		.input(
			z.object({
				filename: z.string(),
			})
		)
		.query(async ({ input, ctx }) => {
			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.contest.symbol,
					'file',
					'download'
				)
			) {
				throw new TRPCError({
					message: 'Not allowed to download file',
					code: 'FORBIDDEN',
				});
			}

			const problemStorage = new ProblemStorage(input.problemId);
			const filepath = problemStorage.getPathForFile(input.filename);
			return problemStorage.getFileAsDataUri(filepath);
		}),

	delete: problemProcedure
		.input(
			z.object({
				filename: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.contest.symbol,
					'file',
					'delete'
				)
			) {
				throw new TRPCError({
					message: 'Not allowed to upload file',
					code: 'FORBIDDEN',
				});
			}

			const problemStorage = new ProblemStorage(input.problemId);
			await problemStorage.deleteFile(input.filename);
		}),

	rename: problemProcedure
		.input(
			z.object({
				oldName: z.string(),
				newName: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.contest.symbol,
					'file',
					'rename'
				)
			) {
				throw new TRPCError({
					message: 'Not allowed to upload file',
					code: 'FORBIDDEN',
				});
			}

			const problemStorage = new ProblemStorage(input.problemId);
			await problemStorage.renameFile(input.oldName, input.newName);
		}),
});
