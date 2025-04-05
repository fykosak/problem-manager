import { asc, eq, inArray } from 'drizzle-orm';
import express from 'express';
import { ParserInput, latexLanguage } from 'lang-latex';

import { db } from '@server/db';
import {
	contestYearTable,
	problemTable,
	problemTopicTable,
	seriesTable,
	textTable,
	topicTable,
} from '@server/db/schema';
import { StorageProvider } from '@server/sockets/storageProvider';

import { asyncHandler } from './asyncHandler';
import { HtmlGenerator } from './compiler/htmlGenerator';
import { UserAuthMiddleware } from './middleware';

export const apiRouter = express.Router();

apiRouter.use('/', asyncHandler(UserAuthMiddleware));

// TODO authorization
apiRouter.get(
	'/contest/:contestId/years',
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
	'/contest/:contestId/topics',
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
	'/topic/:topicId',
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
			contest: problem.series
				? problem.series.contestYear.contestId
				: problem.contestId,
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

// TODO authorization
apiRouter.get(
	'/series/:seriesId',
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
	'/problem/:problemId/tex',
	asyncHandler(async (req, res) => {
		const problemId = Number(req.params.problemId);
		const problem = await db.query.problemTable.findFirst({
			where: eq(problemTable.problemId, problemId),
			with: {
				texts: {
					orderBy: asc(textTable.textId),
				},
			},
		});

		if (!problem) {
			res.status(404).send('Problem does not exist');
			return;
		}

		const ydocStorage = new StorageProvider();
		const ydoc = await ydocStorage.getYDoc(problem.texts[1].textId);
		const contents = ydoc.getText().toJSON();

		const parserInput = new ParserInput(contents);
		const tree = latexLanguage.parser.parse(parserInput);

		const generator = new HtmlGenerator(tree, parserInput, problemId);
		const html = await generator.generateHtml();
		console.log(html);

		res.json(html);
	})
);
