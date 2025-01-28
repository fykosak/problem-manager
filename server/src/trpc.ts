import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';

import { db } from './db';
import { and, eq } from 'drizzle-orm';
import { problemTable, problemTopicTable, textTable, topicTable, typeTable } from './db/schema';

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
		})
	})
});
