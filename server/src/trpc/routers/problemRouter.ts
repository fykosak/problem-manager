import { trpc } from '../trpc';
import { TRPCError } from '@trpc/server';

import { z } from 'zod';
import { db } from '@server/db';

import * as Y from 'yjs';
import { and, eq, inArray } from 'drizzle-orm';
import { Runner } from '@server/runner/runner';
import {
	langEnum,
	problemTable,
	problemTopicTable,
	textTable,
	topicTable,
	workStateEnum,
	workTable,
} from '@server/db/schema';
import { protectedProcedure } from '../middleware';

export const problemRouter = trpc.router({
	metadata: protectedProcedure.input(z.number()).query(async (opts) => {
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
	texts: protectedProcedure.input(z.number()).query(async (opts) => {
		const texts = await db.query.textTable.findMany({
			where: eq(textTable.problemId, opts.input),
		});

		if (texts.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'No text found for problem',
			});
		}

		return texts;
	}),
	work: protectedProcedure.input(z.number()).query(async (opts) => {
		return await db.query.workTable.findMany({
			with: {
				people: true,
			},
			where: eq(workTable.problemId, opts.input),
			orderBy: workTable.workId,
		});
	}),
	updateWorkState: protectedProcedure
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
	updateMetadata: protectedProcedure
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
				.where(eq(problemTopicTable.problemId, opts.input.problemId));
			await db.insert(problemTopicTable).values(
				opts.input.topics.map((topicId) => ({
					problemId: opts.input.problemId,
					topicId: topicId,
				}))
			);
		}),
	build: protectedProcedure.input(z.number()).mutation(async (opts) => {
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
	create: protectedProcedure
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
					message: 'No topic specified within the defined contest',
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
});
