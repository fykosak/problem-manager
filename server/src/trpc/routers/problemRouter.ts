import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import path from 'node:path';
import * as Y from 'yjs';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import config from '@server/config/config';
import { db } from '@server/db';
import {
	type AuthorTypeEnum,
	authorTypeEnum,
	langEnum,
	problemStateEnum,
	problemTable,
	seriesTable,
	textTable,
	textTypeEnum,
	topicTable,
	workStateEnum,
	workTable,
} from '@server/db/schema';
import { ProblemModel } from '@server/problem/problemModel';
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';

import {
	authedProcedure,
	contestProcedure,
	problemProcedure,
} from '../middleware';
import { trpc } from '../trpc';

async function getProblemContest(problemId: number) {
	const problem = await db.query.problemTable.findFirst({
		where: eq(problemTable.problemId, problemId),
		with: {
			contest: true,
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
	});

	if (!problem) {
		throw new TRPCError({
			message: 'Problem does not exist',
			code: 'NOT_FOUND',
		});
	}

	const contestSymbol =
		problem.contest?.symbol ?? problem.series?.contestYear.contest.symbol;
	if (!contestSymbol) {
		throw new TRPCError({
			message: 'Problem not connected to contest',
			code: 'INTERNAL_SERVER_ERROR',
		});
	}

	return contestSymbol;
}

export const problemRouter = trpc.router({
	info: problemProcedure.query(({ ctx }) => {
		return ctx.problem;
	}),

	metadata: problemProcedure.query(async ({ ctx }) => {
		const taskData = await db.query.problemTable.findFirst({
			columns: {
				metadata: true,
			},
			where: eq(problemTable.problemId, ctx.problem.problemId),
			with: {
				topics: true,
				type: true,
				authors: true,
			},
		});

		if (!taskData) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Problem not found',
			});
		}

		return {
			metadata: taskData.metadata,
			topics: taskData.topics.map((topic) => topic.topicId),
			type: taskData.type.typeId,
			authors: Object.fromEntries(
				authorTypeEnum.enumValues.map((type) => [
					type,
					taskData.authors
						.filter((author) => author.type === type)
						.map((author) => author.personId),
				])
			) as Record<AuthorTypeEnum, number[]>,
		};
	}),

	texts: problemProcedure
		.input(
			z.object({
				textType: z.enum(textTypeEnum.enumValues).nullish(),
			})
		)
		.query(async ({ input }) => {
			const texts = await db.query.textTable.findMany({
				where: and(
					eq(textTable.problemId, input.problemId),
					input.textType
						? eq(textTable.type, input.textType)
						: undefined
				),
				orderBy: [asc(textTable.type), asc(textTable.lang)],
			});

			if (texts.length === 0) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'No text found for problem',
				});
			}

			return texts;
		}),

	work: problemProcedure.query(async ({ ctx }) => {
		return await db.query.workTable.findMany({
			with: {
				people: true,
			},
			where: eq(workTable.problemId, ctx.problem.problemId),
			orderBy: workTable.workId,
		});
	}),

	updateWorkState: authedProcedure
		.input(
			z.object({
				workId: z.number(),
				state: z.enum(workStateEnum.enumValues),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const work = await db.query.workTable.findFirst({
				where: eq(workTable.workId, input.workId),
				with: {
					problem: true,
				},
			});

			if (!work) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Work not found',
				});
			}

			const contestSymbol = await getProblemContest(
				work.problem.problemId
			);

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					contestSymbol,
					'work',
					'update'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You cannot change this work',
				});
			}

			const updatedWork = await db
				.update(workTable)
				.set({
					state: input.state,
				})
				.where(eq(workTable.workId, input.workId))
				.returning();

			return updatedWork;
		}),

	addWork: problemProcedure
		.input(
			z.object({
				newWork: z
					.object({
						group: z.string().nonempty(),
						label: z.string().nonempty(),
					})
					.array(),
			})
		)
		.mutation(async ({ input }) => {
			const workWithProblemId = input.newWork.map((work) => ({
				...work,
				problemId: input.problemId,
			}));

			await db.insert(workTable).values(workWithProblemId);
		}),

	updateMetadata: problemProcedure
		.input(
			z.object({
				metadata: z.object<Record<string, any>>({}).passthrough(), // eslint-disable-line
				topics: z.number().array(),
				type: z.number(),
				authors: z.record(
					z.enum(authorTypeEnum.enumValues),
					z.number().array()
				),
			})
		)
		.mutation(async ({ input }) => {
			return await db.transaction(async (tx) => {
				const problemModel = new ProblemModel(tx, input.problemId);
				await problemModel.setMetadata(input.metadata, input.type);
				await problemModel.setTopics(input.topics);
				await problemModel.setAuthors(input.authors);
			});
		}),

	build: problemProcedure
		.input(
			z.object({
				type: z.enum(textTypeEnum.enumValues),
				lang: z.enum(langEnum.enumValues),
			})
		)
		.mutation(async ({ input }) => {
			console.log('build ' + input.problemId);
			const runner = new Runner(input.problemId);
			let returnValue = await runner.run(input.type, input.lang); // eslint-disable-line
			// eslint-disable-next-line
			returnValue = {
				...returnValue,
				file: runner.getPdfContents(input.type, input.lang),
			};
			return returnValue; // eslint-disable-line
		}),

	create: contestProcedure
		.input(
			z.object({
				lang: z.enum(langEnum.enumValues),
				name: z.string().nonempty(),
				origin: z.string().optional(),
				task: z.string().nonempty(),
				topics: z.number().array().min(1),
				type: z.coerce.number(),
				result: z.object({
					value: z.coerce.number().optional(),
					unit: z.string().optional(),
				}),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.contest.symbol,
					'problem',
					'create'
				)
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Cannot create problem for this contest',
				});
			}

			return await db.transaction(async (tx) => {
				// filter topics by contest
				const filteredTopics = await tx.query.topicTable.findMany({
					where: and(
						eq(topicTable.contestId, ctx.contest.contestId),
						inArray(topicTable.topicId, input.topics)
					),
				});

				if (filteredTopics.length < 1) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message:
							'No topic specified within the defined contest',
					});
				}

				// create problem
				const metadata = {
					name: {
						[input.lang]: input.name,
					},
					origin: {},
					result: input.result,
				};
				if (input.origin) {
					metadata['origin'] = {
						[input.lang]: input.origin,
					};
				}

				const problem = (
					await tx
						.insert(problemTable)
						.values({
							typeId: input.type,
							contestId: ctx.contest.contestId,
							metadata: metadata,
						})
						.returning()
				)[0];

				// add text
				const taskYDoc = new Y.Doc();
				taskYDoc.getText().insert(0, input.task);

				const textTypes = config.contestTexts[ctx.contest.symbol];
				if (!textTypes) {
					throw new TRPCError({
						message: 'Could not get languages for contest',
						code: 'INTERNAL_SERVER_ERROR',
					});
				}

				const taskLangs = textTypes['task'];
				if (!taskLangs || !taskLangs.includes(input.lang)) {
					throw new TRPCError({
						message: 'Invalid lang for text type',
						code: 'BAD_REQUEST',
					});
				}

				// TS cannot infer the key type normally, so it explictly
				// declared
				for (const textType of Object.keys(
					textTypes
				) as (keyof typeof textTypes)[]) {
					const textLangs = textTypes[textType];
					if (!textLangs) {
						continue;
					}
					for (const textLang of textLangs) {
						await tx.insert(textTable).values({
							problemId: problem.problemId,
							lang: textLang,
							type: textType,
							contents:
								textType === 'task' && textLang === input.lang
									? Y.encodeStateAsUpdate(taskYDoc)
									: null,
						});
					}
				}

				const problemModel = new ProblemModel(tx, problem.problemId);
				await problemModel.setTopics(
					Array.from(filteredTopics, (topic) => topic.topicId)
				);
				await problemModel.setAuthors({
					concept: [ctx.person.personId],
				});

				return problem;
			});
		}),

	changeState: problemProcedure
		.input(
			z.object({
				state: z.enum(problemStateEnum.enumValues),
			})
		)
		.mutation(async ({ input, ctx }) => {
			if (!ctx.problem.contest) {
				throw new TRPCError({
					message:
						'Cannot change state of this problem, assigned to a series',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.problem.contest.symbol,
					'problem',
					'changeState'
				)
			) {
				throw new TRPCError({
					message:
						'You are not permitted to change state for this problem',
					code: 'FORBIDDEN',
				});
			}

			await db
				.update(problemTable)
				.set({
					state: input.state,
				})
				.where(eq(problemTable.problemId, input.problemId));
		}),

	changeContest: problemProcedure
		.input(
			z.object({
				contestId: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.problem.contest) {
				throw new TRPCError({
					message: 'Problem not assigned to a contest',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					ctx.problem.contest.symbol,
					'problem',
					'changeContest'
				)
			) {
				throw new TRPCError({
					message: 'Not allowed to change contest for problem',
					code: 'FORBIDDEN',
				});
			}

			await db
				.update(problemTable)
				.set({
					contestId: input.contestId,
				})
				.where(eq(problemTable.problemId, ctx.problem.problemId));
		}),

	// series
	assignSeries: problemProcedure
		.input(
			z.object({
				seriesId: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return await db.transaction(async (tx) => {
				if (
					!ctx.problem.contest || // problem already is assigned to series
					!acl.isAllowedContest(
						ctx.aclRoles,
						ctx.problem.contest.symbol,
						'problem',
						'assignSeries'
					)
				) {
					throw new TRPCError({
						message: 'Cannot assign this problem',
						code: 'FORBIDDEN',
					});
				}

				const series = await db.query.seriesTable.findFirst({
					where: eq(seriesTable.seriesId, input.seriesId),
					with: {
						contestYear: true,
					},
				});

				if (
					!series ||
					ctx.problem.contestId !== series.contestYear.contestId
				) {
					throw new TRPCError({
						message: 'Cannot assign problem to this series',
						code: 'BAD_REQUEST',
					});
				}

				const lastProblemInSeries =
					await db.query.problemTable.findFirst({
						where: eq(problemTable.seriesId, series.seriesId),
						orderBy: desc(problemTable.seriesOrder),
					});

				await tx
					.update(problemTable)
					.set({
						contestId: null,
						seriesId: series.seriesId,
						seriesOrder:
							lastProblemInSeries &&
							lastProblemInSeries.seriesOrder
								? lastProblemInSeries.seriesOrder + 1
								: 1,
					})
					.where(eq(problemTable.problemId, ctx.problem.problemId));

				const workConfig =
					config.contestWork[ctx.problem.contest.symbol];
				if (!workConfig) {
					return;
				}

				// Add default (and missing) work to the problem
				const existingWork = new Map<string, Set<string>>();
				for (const work of ctx.problem.work) {
					const group =
						existingWork.get(work.group ?? '') ?? new Set();
					group.add(work.label);
					existingWork.set(work.group ?? '', group);
				}

				const newWorkItems = [];
				for (const workGroup of workConfig) {
					for (const workItem of workGroup.items) {
						if (workItem.optional) {
							continue;
						}

						if (
							existingWork.has(workGroup.groupName) &&
							existingWork
								.get(workGroup.groupName)
								?.has(workItem.name)
						) {
							continue;
						}

						newWorkItems.push({
							problemId: ctx.problem.problemId,
							group: workGroup.groupName,
							label: workItem.name,
						});
					}
				}

				await tx.insert(workTable).values(newWorkItems);
			});
		}),

	// files
	files: trpc.router({
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
				const contestSymbol = await getProblemContest(input.problemId);
				if (
					!acl.isAllowedContest(
						ctx.aclRoles,
						contestSymbol,
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
				const contestSymbol = await getProblemContest(input.problemId);
				if (
					!acl.isAllowedContest(
						ctx.aclRoles,
						contestSymbol,
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
				const contestSymbol = await getProblemContest(input.problemId);
				if (
					!acl.isAllowedContest(
						ctx.aclRoles,
						contestSymbol,
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
				const contestSymbol = await getProblemContest(input.problemId);
				if (
					!acl.isAllowedContest(
						ctx.aclRoles,
						contestSymbol,
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
	}),
});
