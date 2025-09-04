import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import path from 'node:path';
import * as Y from 'yjs';
import { z } from 'zod';

import { acl } from '@server/acl/aclFactory';
import config from '@server/config/config';
import { db } from '@server/db';
import {
	authorTable,
	langEnum,
	problemStateEnum,
	problemTable,
	problemTopicTable,
	seriesTable,
	textTable,
	textTypeEnum,
	topicTable,
	workStateEnum,
	workTable,
} from '@server/db/schema';
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';

import { authedProcedure, contestProcedure } from '../middleware';
import { trpc } from '../trpc';

export const problemRouter = trpc.router({
	info: authedProcedure.input(z.number()).query(async ({ input }) => {
		const problem = await db.query.problemTable.findFirst({
			where: eq(problemTable.problemId, input),
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
		});

		if (!problem) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Problem not found',
			});
		}

		return problem;
	}),

	metadata: authedProcedure.input(z.number()).query(async (opts) => {
		const taskData = await db.query.problemTable.findFirst({
			columns: {
				metadata: true,
			},
			where: eq(problemTable.problemId, opts.input),
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
			authors: {
				task: taskData.authors
					.filter((author) => author.type === 'task')
					.map((author) => author.personId),
				solution: taskData.authors
					.filter((author) => author.type === 'solution')
					.map((author) => author.personId),
			},
		};
	}),

	texts: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
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

	work: authedProcedure.input(z.number()).query(async (opts) => {
		return await db.query.workTable.findMany({
			with: {
				people: true,
			},
			where: eq(workTable.problemId, opts.input),
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
		.mutation(async (opts) => {
			const work = await db
				.update(workTable)
				.set({
					state: opts.input.state,
				})
				.where(eq(workTable.workId, opts.input.workId))
				.returning();
			return work;
		}),

	addWork: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
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
			try {
				await db.insert(workTable).values(workWithProblemId);
			} catch {
				throw new TRPCError({
					message: 'Failed to add work to the problem',
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
		}),

	updateMetadata: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
				metadata: z.object<Record<string, any>>({}).passthrough(), // eslint-disable-line
				topics: z.number().array(),
				type: z.number(),
				authors: z.object({
					task: z.number().array(),
					solution: z.number().array(),
				}),
			})
		)
		.mutation(async ({ input }) => {
			// TODO validation
			await db
				.update(problemTable)
				.set({
					metadata: input.metadata,
					typeId: input.type,
				})
				.where(eq(problemTable.problemId, input.problemId));

			// update topics
			await db
				.delete(problemTopicTable)
				.where(
					and(
						eq(problemTopicTable.problemId, input.problemId),
						notInArray(problemTopicTable.topicId, input.topics)
					)
				);

			await db
				.insert(problemTopicTable)
				.values(
					input.topics.map((topicId) => ({
						problemId: input.problemId,
						topicId: topicId,
					}))
				)
				.onConflictDoNothing();

			// update authors
			for (const type of textTypeEnum.enumValues) {
				const personIds = input.authors[type];
				await db
					.delete(authorTable)
					.where(
						and(
							eq(authorTable.problemId, input.problemId),
							eq(authorTable.type, type),
							notInArray(authorTable.personId, personIds)
						)
					);
				if (personIds.length === 0) {
					continue;
				}
				await db
					.insert(authorTable)
					.values(
						personIds.map((personId) => ({
							personId: personId,
							problemId: input.problemId,
							type: type,
						}))
					)
					.onConflictDoNothing(); // prevents duplicates because of the unique key in schema
			}
		}),

	build: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
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

				const langs = config.contestTextLangs.get(ctx.contest.symbol);
				if (!langs) {
					throw new TRPCError({
						message: 'Could not get languages for contest',
						code: 'INTERNAL_SERVER_ERROR',
					});
				}
				for (const lang of langs) {
					for (const type of textTypeEnum.enumValues) {
						if (!(langEnum.enumValues as string[]).includes(lang)) {
							continue;
						}
						// @ts-expect-error Lang is check that its valid, but it's type is
						// not specified.
						await tx.insert(textTable).values({
							problemId: problem.problemId,
							lang: lang,
							type: type,
							contents:
								type === 'task' && lang === input.lang
									? Y.encodeStateAsUpdate(taskYDoc)
									: null,
						});
					}
				}

				// add topics
				await tx.insert(problemTopicTable).values(
					Array.from(filteredTopics, (topic) => ({
						problemId: problem.problemId,
						topicId: topic.topicId,
					}))
				);

				await tx.insert(authorTable).values({
					personId: ctx.person.personId,
					problemId: problem.problemId,
					type: 'task',
				});

				return problem;
			});
		}),

	changeState: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
				state: z.enum(problemStateEnum.enumValues),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const problem = await db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, input.problemId),
				with: {
					contest: true,
				},
			});

			if (!problem) {
				throw new TRPCError({
					message: 'Problem does not exist',
					code: 'BAD_REQUEST',
				});
			}

			if (!problem.contest) {
				throw new TRPCError({
					message:
						'Cannot change state of this problem, assigned to a series',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					problem.contest.symbol,
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

	changeContest: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
				contestId: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const problem = await db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, input.problemId),
				with: {
					contest: true,
				},
			});

			if (!problem) {
				throw new TRPCError({
					message: 'Problem does not exist',
					code: 'BAD_REQUEST',
				});
			}

			if (!problem.contest) {
				throw new TRPCError({
					message: 'Problem not assigned to a contest',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!acl.isAllowedContest(
					ctx.aclRoles,
					problem.contest.symbol,
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
				.where(eq(problemTable.problemId, problem.problemId));
		}),

	// series
	assignSeries: authedProcedure
		.input(
			z.object({
				problemId: z.number(),
				seriesId: z.number(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const problem = await db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, input.problemId),
				with: {
					contest: true,
					work: true,
				},
			});

			if (!problem) {
				throw new TRPCError({
					message: 'Problem does not exist',
					code: 'BAD_REQUEST',
				});
			}

			if (
				!problem.contest || // problem already is assigned to series
				!acl.isAllowedContest(
					ctx.aclRoles,
					problem.contest.symbol,
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

			if (!series || problem.contestId !== series.contestYear.contestId) {
				throw new TRPCError({
					message: 'Cannot assign problem to this series',
					code: 'BAD_REQUEST',
				});
			}

			const lastProblemInSeries = await db.query.problemTable.findFirst({
				where: eq(problemTable.seriesId, series.seriesId),
				orderBy: desc(problemTable.seriesOrder),
			});

			await db
				.update(problemTable)
				.set({
					contestId: null,
					seriesId: series.seriesId,
					seriesOrder:
						lastProblemInSeries && lastProblemInSeries.seriesOrder
							? lastProblemInSeries.seriesOrder + 1
							: 1,
				})
				.where(eq(problemTable.problemId, problem.problemId));

			const workConfig = config.contestWork[problem.contest.symbol];
			if (!workConfig) {
				return;
			}

			// Add default (and missing) work to the problem
			const existingWork = new Map<string | null, Set<string>>();
			for (const work of problem.work) {
				const group = existingWork.get(work.group) ?? new Set();
				group.add(work.label);
				existingWork.set(work.group, group);
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
						problemId: problem.problemId,
						group: workGroup.groupName,
						label: workItem.name,
					});
				}
			}

			await db.insert(workTable).values(newWorkItems);
		}),

	// files
	files: trpc.router({
		list: authedProcedure.input(z.number()).query(async ({ input }) => {
			const problemStorage = new ProblemStorage(input);
			return await problemStorage.getFiles();
		}),

		upload: authedProcedure
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
			.mutation(async ({ input }) => {
				const problem = await db.query.problemTable.findFirst({
					where: eq(problemTable.problemId, input.problemId),
				});
				if (!problem) {
					throw new TRPCError({
						message: 'Problem does not exist',
						code: 'BAD_REQUEST',
					});
				}

				// TODO check for user permissions

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

		delete: authedProcedure
			.input(
				z.object({
					problemId: z.number(),
					filename: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const problemStorage = new ProblemStorage(input.problemId);
				await problemStorage.deleteFile(input.filename);
			}),

		rename: authedProcedure
			.input(
				z.object({
					problemId: z.number(),
					oldName: z.string(),
					newName: z.string(),
				})
			)
			.mutation(async ({ input }) => {
				const problemStorage = new ProblemStorage(input.problemId);
				await problemStorage.renameFile(input.oldName, input.newName);
			}),
	}),
});
