import { eq, inArray } from 'drizzle-orm';
import express from 'express';

import { db } from '@server/db';
import {
	contestYearTable,
	problemTable,
	problemTopicTable,
	seriesTable,
	topicTable,
} from '@server/db/schema';

import { asyncHandler } from './asyncHandler';
import { UserAuthMiddleware } from './middleware';

export const apiRouter = express.Router();

apiRouter.use('/', asyncHandler(UserAuthMiddleware));

// TODO authorization
apiRouter.get(
	'/contest/:contestId(\\d+)/years',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);
		const years = await db.query.contestYearTable.findMany({
			where: eq(contestYearTable.contestId, contestId),
			with: { series: true },
		});

		res.json(years);
	})
);

// TODO authorization
apiRouter.get(
	'/contest/:contestId(\\d+)/topics',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);
		const topics = await db.query.topicTable.findMany({
			where: eq(topicTable.contestId, contestId),
		});

		res.json(topics);
	})
);

// TODO authorization
apiRouter.get(
	'/topic/:topicId(\\d+)',
	asyncHandler(async (req, res) => {
		const topicId = Number(req.params.topicId);
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

// TODO authorization
apiRouter.get('/problem/:problemId(\\d+)', (req, res) => {
	// TODO tex generation
	res.sendStatus(501);
});

// TODO authorization
apiRouter.get(
	'/series/:seriesId(\\d+)',
	asyncHandler(async (req, res) => {
		const seriesId = Number(req.params.seriesId);

		// TODO html generation
		const series = await db.query.seriesTable.findFirst({
			where: eq(seriesTable.seriesId, seriesId),
			with: { problems: true },
		});

		res.json(series);
	})
);

// TODO authorization
apiRouter.get(
	'/series/:seriesId(\\d+)',
	asyncHandler(async (req, res) => {
		const seriesId = Number(req.params.seriesId);
		const series = await db.query.seriesTable.findFirst({
			where: eq(seriesTable.seriesId, seriesId),
			with: { problems: true },
		});

		res.json(series);
	})
);
