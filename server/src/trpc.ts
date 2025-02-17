import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';

import { db } from './db';
import { and, eq } from 'drizzle-orm';
import { personWorkTable, problemTable, problemTopicTable, textTable, topicTable, typeTable, workStateEnum, workTable } from './db/schema';

// created for each request
export const createContext = ({
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;

const trpc = initTRPC.context<Context>().create();
export const appRouter = trpc.router({
	getProblems: trpc.procedure.input(z.number()).query(async (opts) => {
		return await db.query.problemTable.findMany({
			with: {
				problemTopics: {
					with: {
						topic: true
					}
				},
				type: true,
				authors: {
					with: {
						person: true
					}
				}
			},
			//where: eq(problemTable, opts.input)
		});
	}),
	getContests: trpc.procedure.query(async () => {
		return await db.query.contestTable.findMany({
			with: {
				years: true
			}
		})
	}),
	problem: trpc.router({
		metadata: trpc.procedure.input(z.number()).query(async (opts) => {
			const taskData = await db.query.problemTable.findFirst({
				columns: {
					metadata: true
				},
				where: eq(problemTable.problemId, opts.input),
				with: {
					topics: true,
					type: true
				}
			});

			if (taskData === undefined) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Problem not found'
				})
			}

			return {
				metadata: taskData.metadata,
				topics: taskData.topics.map((topic) => topic.topicId),
				type: taskData.type.typeId
			};
		}),
		texts: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.textTable.findMany({
				where: eq(textTable.problemId, opts.input)
			});
		}),
		work: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.workTable.findMany({
				with: {
					people: true
				},
				where: eq(workTable.problemId, opts.input),
				orderBy: workTable.workId
			})
		}),
		updateWorkState: trpc.procedure.input(z.object({
			workId: z.number(),
			state: z.enum(workStateEnum.enumValues),
		})).query(async (opts) => {
			return await db.update(workTable).set({
				state: opts.input.state
			}).where(eq(workTable.workId, opts.input.workId))
		}),
		updateMetadata: trpc.procedure.input(z.object({
			problemId: z.number(),
			metadata: z.object<{ [key: string]: any }>({}).passthrough(),
			topics: z.number().array(),
			type: z.number()
		})).mutation(async (opts) => {
			// TODO validation
			console.log(opts.input.metadata);
			await db.update(problemTable).set({
				metadata: opts.input.metadata,
				typeId: opts.input.type
			}).where(eq(problemTable.problemId, opts.input.problemId));
			await db.delete(problemTopicTable).where(eq(problemTopicTable.problemId, opts.input.problemId));
			await db.insert(problemTopicTable).values(opts.input.topics.map((topicId) => ({
				problemId: opts.input.problemId,
				topicId: topicId
			})));
		})
	}),
	contest: trpc.router({
		availableTopics: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.topicTable.findMany({
				where: and(eq(topicTable.contestId, opts.input), eq(topicTable.available, true))
			})
		}),
		availableTypes: trpc.procedure.input(z.number()).query(async (opts) => {
			return await db.query.typeTable.findMany({
				where: and(eq(typeTable.contestId, opts.input), eq(typeTable.available, true))
			})
		}),
		people: trpc.procedure.input(z.number()).query(async (opts) => {
			// TODO filter by contest organizer
			return await db.query.personTable.findMany();
		})
	}),
	work: trpc.router({
		updatePersonWork: trpc.procedure.input(z.object({
			workId: z.number(),
			personId: z.number(),
			assigned: z.boolean()
		})).query(async (opts) => {
			if (opts.input.assigned) {
				await db.insert(personWorkTable).values({
					workId: opts.input.workId,
					personId: opts.input.personId,
				})
			} else {
				await db.delete(personWorkTable)
					.where(
						and(
							eq(personWorkTable.workId, opts.input.workId),
							eq(personWorkTable.personId, opts.input.personId)
						)
					)
			}
		})
	})
});
