import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

import * as Y from 'yjs';
import { db } from './db';
import { and, eq, inArray } from 'drizzle-orm';
import {
	langEnum,
	personWorkTable,
	problemTable,
	problemTopicTable,
	textTable,
	topicTable,
	typeTable,
	workStateEnum,
	workTable,
} from './db/schema';
import { Runner } from './runner/runner';

// created for each request
export const createContext = () => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

const trpc = initTRPC.context<Context>().create();
export const appRouter = trpc.router({
	getProblems: trpc.procedure.input(z.number()).query(async () => {
		return await db.query.problemTable.findMany({
			with: {
				problemTopics: {
					with: {
						topic: true,
					},
				},
				type: true,
				authors: {
					with: {
						person: true,
					},
				},
			},
			//where: eq(problemTable, opts.input)
		});
	}),
	getContests: trpc.procedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				years: true,
			},
		});
	}),
	problem: trpc.router({
		metadata: trpc.procedure.input(z.number()).query(async (opts) => {
			const taskData = await db.query.problemTable.findFirst({
				columns: {
					metadata: true,
				},
				where: eq(problemTable.problemId, opts.input),
				with: {
					topics: true,
					type: true,
				},
			});

			if (taskData === undefined) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Problem not found',
				});
			}

			return {
				metadata: taskData.metadata,
				topics: taskData.topics.map((topic) => topic.topicId),
				type: taskData.type.typeId,
			};
		}),
		texts: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.textTable.findMany({
				where: eq(textTable.problemId, opts.input),
			});
		}),
		work: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.workTable.findMany({
				with: {
					people: true,
				},
				where: eq(workTable.problemId, opts.input),
				orderBy: workTable.workId,
			});
		}),
		updateWorkState: trpc.procedure
			.input(
				z.object({
					workId: z.number(),
					state: z.enum(workStateEnum.enumValues),
				})
			)
			.query(async (opts) => {
				return await db
					.update(workTable)
					.set({
						state: opts.input.state,
					})
					.where(eq(workTable.workId, opts.input.workId));
			}),
		updateMetadata: trpc.procedure
			.input(
				z.object({
					problemId: z.number(),
					metadata: z.object<Record<string, any>>({}).passthrough(), // eslint-disable-line
					topics: z.number().array(),
					type: z.number(),
				})
			)
			.mutation(async (opts) => {
				// TODO validation
				console.log(opts.input.metadata);
				await db
					.update(problemTable)
					.set({
						metadata: opts.input.metadata,
						typeId: opts.input.type,
					})
					.where(eq(problemTable.problemId, opts.input.problemId));
				await db
					.delete(problemTopicTable)
					.where(
						eq(problemTopicTable.problemId, opts.input.problemId)
					);
				await db.insert(problemTopicTable).values(
					opts.input.topics.map((topicId) => ({
						problemId: opts.input.problemId,
						topicId: topicId,
					}))
				);
			}),
		build: trpc.procedure.input(z.number()).mutation(async (opts) => {
			console.log('build ' + opts.input);
			const runner = new Runner();
			let returnValue = await runner.run(opts.input);
			returnValue = {
				...returnValue,
				file: runner.getPdfContests(opts.input),
			};
			console.log(returnValue);
			return returnValue; // @ts-expect-error any return value
		}),
		create: trpc.procedure
			.input(
				z.object({
					contestId: z.number(),
					lang: z.enum(langEnum.enumValues),
					name: z.string().nonempty(),
					origin: z.string().optional(),
					task: z.string().nonempty(),
					topics: z.number().array().min(1),
					type: z.coerce.number(),
				})
			)
			.mutation(async (opts) => {
				// TODO validate contestId for available contests of user
				// TODO to db transaction

				// filter topics by contest
				const filteredTopics = await db.query.topicTable.findMany({
					where: and(
						eq(topicTable.contestId, opts.input.contestId),
						inArray(topicTable.topicId, opts.input.topics)
					),
				});

				if (filteredTopics.length < 1) {
					throw new TRPCError({
						code: 'BAD_REQUEST',
						message: 'No topic specify within the defined contest',
					});
				}

				// create problem
				let metadata = {
					name: {
						[opts.input.lang]: opts.input.name,
					},
					origin: {},
				};
				if (opts.input.origin) {
					metadata['origin'] = {
						[opts.input.lang]: opts.input.origin,
					};
				}
				const problem = (
					await db
						.insert(problemTable)
						.values({
							typeId: opts.input.type,
							metadata: metadata,
						})
						.returning()
				)[0];

				// add text
				const taskYDoc = new Y.Doc();
				taskYDoc.getText().insert(0, opts.input.task);
				await db.insert(textTable).values({
					problemId: problem.problemId,
					lang: opts.input.lang,
					type: 'task',
					contents: Y.encodeStateAsUpdate(taskYDoc),
				});

				// add topics
				await db.insert(problemTopicTable).values(
					Array.from(filteredTopics, (topic) => ({
						problemId: problem.problemId,
						topicId: topic.topicId,
					}))
				);

				// TODO add author

				return problem;
			}),
	}),
	contest: trpc.router({
		// TODO filter by organizer contests
		createProblemData: trpc.procedure.query(async () => {
			return await db.query.contestTable.findMany({
				with: {
					topics: true,
					types: true,
				},
			});
		}),
		availableTopics: trpc.procedure
			.input(z.number())
			.query(async (opts) => {
				return await db.query.topicTable.findMany({
					where: and(
						eq(topicTable.contestId, opts.input),
						eq(topicTable.available, true)
					),
				});
			}),
		availableTypes: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.typeTable.findMany({
				where: and(
					eq(typeTable.contestId, opts.input),
					eq(typeTable.available, true)
				),
			});
		}),
		people: trpc.procedure.input(z.number()).query(async () => {
			// TODO filter by contest organizer
			return await db.query.personTable.findMany();
		}),
	}),
	work: trpc.router({
		updatePersonWork: trpc.procedure
			.input(
				z.object({
					workId: z.number(),
					personId: z.number(),
					assigned: z.boolean(),
				})
			)
			.query(async (opts) => {
				if (opts.input.assigned) {
					await db.insert(personWorkTable).values({
						workId: opts.input.workId,
						personId: opts.input.personId,
					});
				} else {
					await db
						.delete(personWorkTable)
						.where(
							and(
								eq(personWorkTable.workId, opts.input.workId),
								eq(
									personWorkTable.personId,
									opts.input.personId
								)
							)
						);
				}
			}),
	}),
});
