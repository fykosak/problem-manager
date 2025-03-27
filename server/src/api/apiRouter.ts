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
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';

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

// TODO move to trpc
apiRouter.post(
	'/files/upload',
	asyncHandler(async (req, res) => {
		if (!req.files || Object.keys(req.files).length === 0) {
			return res.status(400).send('No files provided');
		}

		if (!('files' in req.files)) {
			return res.status(400).send('Files not provided');
		}

		let files = req.files.files;
		if (!Array.isArray(files)) {
			files = [files];
		}

		// eslint-disable-next-line
		const problemIdString = req.body.problemId as string;
		if (!problemIdString) {
			return res.status(400).send('ProblemId not provided');
		}
		const problemId = Number(problemIdString);

		const problem = await db.query.problemTable.findFirst({
			where: eq(problemTable.problemId, problemId),
		});
		if (!problem) {
			return res.status(400).send('Problem does not exist');
		}

		// TODO check for user permissions

		const runner = new Runner(problemId);
		const problemStorage = new ProblemStorage(problemId);

		for (const file of files) {
			const filepath = problemStorage.getPathForFile(file.name);
			await file.mv(problemStorage.getPathForFile(file.name));
			await runner.exportFile(filepath);
		}

		res.sendStatus(200);
	})
);
