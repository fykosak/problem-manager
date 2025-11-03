import {
	and,
	asc,
	eq,
	exists,
	inArray,
	isNotNull,
	isNull,
	lt,
	not,
	or,
} from 'drizzle-orm';
import express from 'express';
import { type Response } from 'express';
import * as Y from 'yjs';
import { z } from 'zod';

import config from '@server/config/config';
import { db } from '@server/db';
import {
	authorTable,
	contestTable,
	contestYearTable,
	langEnum,
	organizerTable,
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

async function testPersonAuthorized(contestId: number, res: Response) {
	const person = res.locals.person as RequestPerson;

	const contest = await db.query.contestTable.findFirst({
		where: eq(contestTable.contestId, contestId),
	});
	if (!contest) {
		throw new Error('Contest does not exist');
	}

	// get target contest by organizer mapping
	let mappedSymbol = null;
	if (contest.symbol in config.organizerMapping) {
		mappedSymbol = config.organizerMapping[contest.symbol];
	}

	// check existance of organizer by both original contest id and mapped
	// contest symbol
	const organizer = person.organizers.find(
		(organizer) =>
			organizer.contestId === contestId ||
			(mappedSymbol && organizer.contest.symbol == mappedSymbol)
	);

	if (!organizer) {
		throw new Error('Unauthorized to access this contest');
	}
}

/**
 * Web api route for listing series with released texts
 */
apiRouter.get(
	'/contest/:contestId/years',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);

		try {
			await testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
		}

		// Get only the series (and with that the contest years) that
		// should be published -> current date is after the release date
		// and series has at least one released text
		const contestYearSeries = await db
			.select()
			.from(contestYearTable)
			.innerJoin(
				seriesTable,
				eq(seriesTable.contestYearId, contestYearTable.contestYearId)
			)
			.where(
				and(
					eq(contestYearTable.contestId, contestId),
					or(
						isNull(seriesTable.release),
						lt(seriesTable.release, new Date())
					),
					exists(
						db
							.select()
							.from(textTable)
							.leftJoin(
								problemTable,
								eq(problemTable.problemId, textTable.problemId)
							)
							.where(
								and(
									eq(
										seriesTable.seriesId,
										problemTable.seriesId
									),
									not(isNull(textTable.html))
								)
							)
					)
				)
			)
			.orderBy(
				asc(contestYearTable.year),
				asc(seriesTable.deadline),
				asc(seriesTable.seriesId)
			);

		const contestYears = new Map<
			number,
			(typeof contestYearSeries)[number]['contest_year'] & {
				series: (typeof contestYearSeries)[number]['series'][];
			}
		>();

		for (const series of contestYearSeries) {
			const contestYear = contestYears.get(series.contest_year.year);
			if (contestYear) {
				contestYear.series.push(series.series);
			} else {
				contestYears.set(series.contest_year.year, {
					...series.contest_year,
					series: [series.series],
				});
			}
		}

		res.json(Array.from(contestYears.values()));
	})
);

/**
 * List contest topics
 */
apiRouter.get(
	'/contest/:contestId/topics',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);

		try {
			await testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
		}

		const topics = await db.query.topicTable.findMany({
			where: eq(topicTable.contestId, contestId),
		});

		res.json(topics);
	})
);

/**
 * Get problems with specific topic
 */
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
			await testPersonAuthorized(topic.contestId, res);
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

/**
 * Get specified series with problems and texts in HTML
 */
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
					orderBy: asc(problemTable.seriesOrder),
				},
				contestYear: true,
			},
		});

		if (!series) {
			res.status(404).send('Series does not exist');
			return;
		}

		try {
			await testPersonAuthorized(series.contestYear.contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		const modifiedProblems = [];
		for (const problem of series.problems) {
			const topics = problem.topics.map(
				(problemTopic) => problemTopic.topic.label
			);
			const contestId =
				problem.contestId ?? problem.series?.contestYear.contestId;
			if (!contestId) {
				res.status(500).send('Could not get contest id');
				return;
			}
			modifiedProblems.push({
				...problem,
				topics: topics,
				contestId: contestId,
			});
		}

		res.json({ ...series, problems: modifiedProblems });
	})
);

/**
 * Get problem by contest, year, series label and number
 */
apiRouter.get(
	'/contest/:contestId/year/:year/series/:seriesLabel/problem/:seriesOrder',
	asyncHandler(async (req, res) => {
		const contestId = Number(req.params.contestId);
		const year = Number(req.params.year);
		const seriesLabel = req.params.seriesLabel;
		const seriesOrder = Number(req.params.seriesOrder);

		try {
			await testPersonAuthorized(contestId, res);
		} catch {
			res.status(403).send('Cannot access this contest');
			return;
		}

		const contestYear = await db.query.contestYearTable.findFirst({
			where: and(
				eq(contestYearTable.contestId, contestId),
				eq(contestYearTable.year, year)
			),
		});

		if (!contestYear) {
			res.status(404).send('Contest year does not exist');
			return;
		}

		const series = await db.query.seriesTable.findFirst({
			where: and(
				eq(seriesTable.contestYearId, contestYear.contestYearId),
				eq(seriesTable.label, seriesLabel)
			),
		});

		if (!series) {
			res.status(404).send('Series does not exist');
			return;
		}

		const problem = await db.query.problemTable.findFirst({
			where: and(
				eq(problemTable.seriesId, series.seriesId),
				eq(problemTable.seriesOrder, seriesOrder)
			),
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
				authors: true,
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

		const authorSignatures = new Map<string, string[]>();
		for (const authorType of textTypeEnum.enumValues) {
			const authors = problem.authors.filter(
				(author) => author.type === authorType
			);
			const personIds = authors.map((author) => author.personId);
			const organizers = await db.query.organizerTable.findMany({
				columns: {
					texSignature: true,
				},
				where: and(
					inArray(organizerTable.personId, personIds),
					isNotNull(organizerTable.texSignature),
					eq(organizerTable.contestId, contestId)
				),
			});
			authorSignatures.set(
				authorType,
				// @ts-expect-error only organizer with a signature are selected,
				// so the correct type is string instead of string | null
				organizers.map((organizer) => organizer.texSignature)
			);
		}

		const problemStorage = new ProblemStorage(problem.problemId);
		const filenames = await problemStorage.getFiles();
		console.log(filenames);

		const files = [];
		for (const filename of filenames) {
			files.push({
				name: filename,
				contents: await problemStorage.getFileAsBase64(
					problemStorage.getPathForFile(filename)
				),
			});
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
			authorSignatures: Object.fromEntries(authorSignatures),
			files: files,
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

		const contest = await db.query.contestTable.findFirst({
			where: eq(contestTable.contestId, problemData.contestId),
		});

		if (!contest) {
			res.status(404).send('Contest does not exist');
			return;
		}

		let contestId = problemData.contestId;
		if (Object.keys(config.organizerMapping).includes(contest.symbol)) {
			const mappedSymbol = config.organizerMapping[contest.symbol];
			const mappedContest = await db.query.contestTable.findFirst({
				where: eq(contestTable.symbol, mappedSymbol),
			});
			if (!mappedContest) {
				res.status(500).send('Mapped contest does not exist');
				return;
			}
			contestId = mappedContest.contestId;
		}

		try {
			await testPersonAuthorized(contestId, res);
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

		// prevent accidentally importing the same problem twice
		if (series && problemData.seriesOrder) {
			const oldProblem = await db.query.problemTable.findFirst({
				where: and(
					eq(problemTable.seriesId, series.seriesId),
					eq(problemTable.seriesOrder, problemData.seriesOrder)
				),
			});

			if (oldProblem) {
				res.status(409).send(
					'Imported problem already exists in series'
				);
				return;
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
			if (problemData.topics.length > 0) {
				await tx.insert(problemTopicTable).values(
					problemData.topics.map((topicId) => ({
						problemId: problem.problemId,
						topicId: topicId,
					}))
				);
			}

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
			if (problemData.authors.length > 0) {
				await tx.insert(authorTable).values(
					problemData.authors.map((author) => ({
						problemId: problem.problemId,
						personId: author.personId,
						type: author.type,
					}))
				);
			}

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
