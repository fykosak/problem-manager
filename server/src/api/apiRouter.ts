import { and, eq, inArray } from 'drizzle-orm';
import express from 'express';
import { type Response } from 'express';
import * as Y from 'yjs';
import { z } from 'zod';

import { db } from '@server/db';
import {
	authorTable,
	contestYearTable,
	langEnum,
	problemTable,
	problemTopicTable,
	seriesTable,
	textTable,
	textTypeEnum,
	topicTable,
} from '@server/db/schema';
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';
import { StorageProvider } from '@server/sockets/storageProvider';

import { asyncHandler } from './asyncHandler';
import { type RequestPerson, UserAuthMiddleware } from './middleware';

export const apiRouter = express.Router();

apiRouter.use('/', asyncHandler(UserAuthMiddleware));

function testPersonAuthorized(contestId: number, res: Response) {
	const person = res.locals.person as RequestPerson;
	const organizer = person.organizers.find(
		(organizer) => organizer.contestId === contestId
	);

	if (!organizer) {
		throw new Error('Unauthorized to access this contest');
	}
}

apiRouter.get(
	'/contest/:contestId/years',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);

		try {
			testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
		}

		const years = await db.query.contestYearTable.findMany({
			where: eq(contestYearTable.contestId, contestId),
			with: { series: true },
		});

		res.json(years);
	})
);

apiRouter.get(
	'/contest/:contestId/topics',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);

		try {
			testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
		}

		const topics = await db.query.topicTable.findMany({
			where: eq(topicTable.contestId, contestId),
		});

		res.json(topics);
	})
);

apiRouter.get(
	'/topic/:topicId',
	asyncHandler(async (req, res) => {
		const topicId = Number(req.params.topicId);

		const topic = await db.query.topicTable.findFirst({
			where: eq(topicTable.topicId, topicId),
		});

		if (!topic) {
			res.status(404).send('Topic not found');
			return;
		}

		try {
			testPersonAuthorized(topic.contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		const problemTopics = await db.query.problemTopicTable.findMany({
			where: eq(problemTopicTable.topicId, topicId),
		});

		const problemIds = problemTopics.map(
			(problemTopic) => problemTopic.problemId
		);
		const problems = await db.query.problemTable.findMany({
			where: inArray(problemTable.problemId, problemIds),
		});

		res.json(problems);
	})
);

apiRouter.get(
	'/series/:seriesId',
	asyncHandler(async (req, res) => {
		const seriesId = Number(req.params.seriesId);

		const series = await db.query.seriesTable.findFirst({
			where: eq(seriesTable.seriesId, seriesId),
			with: {
				problems: {
					with: {
						texts: {
							columns: {
								contents: false,
							},
						},
					},
				},
				contestYear: true,
			},
		});

		if (!series) {
			res.status(404).send('Series does not exist');
			return;
		}

		try {
			testPersonAuthorized(series.contestYear.contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		res.json(series);
	})
);

apiRouter.get(
	'/problem/:problemId',
	asyncHandler(async (req, res) => {
		const problemId = Number(req.params.problemId);
		const problem = await db.query.problemTable.findFirst({
			where: eq(problemTable.problemId, problemId),
			with: {
				texts: true,
				type: true,
				topics: {
					with: {
						topic: true,
					},
				},
				series: {
					with: {
						contestYear: true,
					},
				},
			},
		});

		if (!problem) {
			res.status(404).send('Problem does not exist');
			return;
		}

		const contestId = problem.series
			? problem.series.contestYear.contestId
			: problem.contestId;

		if (!contestId) {
			res.status(500).send('Problem not assigned to contest');
			return;
		}

		try {
			testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		const ydocStorage = new StorageProvider();
		const texts: Record<string, Record<string, string>> = {};

		for (const text of problem.texts) {
			const ydoc = await ydocStorage.getYDoc(text.textId);
			const contents = ydoc.getText().toJSON();
			if (!(text.type in texts)) {
				texts[text.type] = {};
			}
			texts[text.type][text.lang] = contents;
		}

		res.json({
			problemId: problem.problemId,
			contest: contestId,
			year: problem.series?.contestYear.year,
			series: problem.series?.label,
			seriesOrder: problem.seriesOrder,
			metadata: problem.metadata,
			type: problem.type.label,
			topics: problem.topics.map(
				(problemTopic) => problemTopic.topic.label
			),
			texts: texts,
		});
	})
);

apiRouter.post(
	'/problem/import',
	asyncHandler(async (req, res) => {
		// validation
		const problemSchema = z.object({
			contestId: z.number(),
			year: z.number().optional(),
			series: z.string().optional(),
			seriesOrder: z.number().optional(),
			metadata: z.object<Record<string, any>>({}).passthrough(), // eslint-disable-line
			typeId: z.number(),
			topics: z.number().array(),
			texts: z
				.object({
					lang: z.enum(langEnum.enumValues),
					type: z.enum(textTypeEnum.enumValues),
					contents: z.string(),
				})
				.array(),
			authors: z
				.object({
					personId: z.number(),
					type: z.enum(textTypeEnum.enumValues),
				})
				.array(),
			graphics: z
				.object({
					name: z.string().nonempty(),
					contents: z.string().nonempty(),
				})
				.array(),
		});

		const parseResult = problemSchema.safeParse(req.body);
		if (!parseResult.success) {
			res.status(400).send(parseResult.error.message);
			return;
		}

		const problemData = parseResult.data;

		try {
			testPersonAuthorized(problemData.contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		let contestYear = null;
		let series = null;

		if (problemData.year && problemData.series) {
			contestYear = await db.query.contestYearTable.findFirst({
				where: and(
					eq(contestYearTable.contestId, problemData.contestId),
					eq(contestYearTable.year, problemData.year)
				),
			});

			if (!contestYear) {
				contestYear = (
					await db
						.insert(contestYearTable)
						.values({
							contestId: problemData.contestId,
							year: problemData.year,
						})
						.returning()
				)[0];
			}

			series = await db.query.seriesTable.findFirst({
				where: and(
					eq(seriesTable.contestYearId, contestYear.contestYearId),
					eq(seriesTable.label, problemData.series)
				),
			});

			if (!series) {
				series = (
					await db
						.insert(seriesTable)
						.values({
							contestYearId: contestYear.contestYearId,
							label: problemData.series,
						})
						.returning()
				)[0];
			}
		}

		await db.transaction(async (tx) => {
			// problem
			const problem = (
				await tx
					.insert(problemTable)
					.values({
						contestId: series ? null : problemData.contestId,
						seriesId: series ? series.seriesId : null,
						seriesOrder: series ? problemData.seriesOrder : null,
						typeId: problemData.typeId,
						metadata: problemData.metadata,
					})
					.returning()
			)[0];

			// topics
			await tx.insert(problemTopicTable).values(
				problemData.topics.map((topicId) => ({
					problemId: problem.problemId,
					topicId: topicId,
				}))
			);

			// texts
			for (const text of problemData.texts) {
				const taskYDoc = new Y.Doc();
				taskYDoc.getText().insert(0, text.contents);
				await tx.insert(textTable).values({
					problemId: problem.problemId,
					lang: text.lang,
					type: text.type,
					contents: Y.encodeStateAsUpdate(taskYDoc),
				});
			}

			// authors
			await tx.insert(authorTable).values(
				problemData.authors.map((author) => ({
					problemId: problem.problemId,
					personId: author.personId,
					type: author.type,
				}))
			);

			const problemStorage = new ProblemStorage(problem.problemId);
			const runner = new Runner(problem.problemId);

			for (const file of problemData.graphics) {
				await problemStorage.saveFile(file.name, file.contents);
				const filepath = problemStorage.getPathForFile(file.name);
				await runner.exportFile(filepath);
			}
		});

		res.sendStatus(200);
	})
);
