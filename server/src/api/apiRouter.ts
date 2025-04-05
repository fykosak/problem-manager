import { eq, inArray } from 'drizzle-orm';
import express from 'express';
import { type Response } from 'express';

import { db } from '@server/db';
import {
	contestYearTable,
	problemTable,
	problemTopicTable,
	seriesTable,
	topicTable,
} from '@server/db/schema';
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
