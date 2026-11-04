import { and, asc, desc, eq, notInArray } from 'drizzle-orm';
import * as Y from 'yjs';

import config from '@server/config/config';
import type { DbConnection } from '@server/db';
import {
	type AuthorTypeEnum,
	type LangEnum,
	type ProblemStateEnum,
	type TextTypeEnum,
	authorTable,
	authorTypeEnum,
	problemTable,
	problemTopicTable,
	textTable,
	typeTable,
	workTable,
} from '@server/db/schema';
import { BadRequestError } from '@server/errors/badRequestError';
import { NotFoundError } from '@server/errors/notFoundError';

import type { ProblemMetadataType } from './types';

export class ProblemModel {
	private problemId: number;

	/**
	 * Connection to database
	 *
	 * As a parameter to be able to also provide transaction as a connection.
	 * If default db connection is used inside of transaction, transaction
	 * won't be used and the whole action won't be atomic.
	 */
	private db: DbConnection;

	constructor(db: DbConnection, problemId: number) {
		this.db = db;
		this.problemId = problemId;
	}

	public async getProblem() {
		const problem = await this.db.query.problemTable.findFirst({
			where: eq(problemTable.problemId, this.problemId),
			with: {
				series: {
					with: {
						contestYear: {
							with: {
								contest: true,
							},
						},
					},
				},
				contest: true,
			},
		});

		if (!problem) {
			throw new NotFoundError('Problem not found');
		}

		return problem;
	}

	public async getMetadata() {
		return await this.db.query.problemTable.findFirst({
			columns: {
				metadata: true,
			},
			where: eq(problemTable.problemId, this.problemId),
			with: {
				topics: true,
				type: true,
				authors: true,
			},
		});
	}

	public async getTexts(textType?: TextTypeEnum) {
		return await this.db.query.textTable.findMany({
			where: and(
				eq(textTable.problemId, this.problemId),
				textType ? eq(textTable.type, textType) : undefined
			),
			orderBy: [asc(textTable.type), asc(textTable.lang)],
		});
	}

	public async getWork() {
		return await this.db.query.workTable.findMany({
			with: {
				people: true,
			},
			where: eq(workTable.problemId, this.problemId),
			orderBy: workTable.workId,
		});
	}

	public async getContest() {
		const problem = await this.getProblem();

		const contest = problem.series?.contestYear.contest ?? problem.contest;

		if (!contest) {
			throw new Error('Could not determine problem contest');
		}

		return contest;
	}

	public async setMetadata(metadata: ProblemMetadataType): Promise<void> {
		// TODO Validate metadata shape
		await this.db
			.update(problemTable)
			.set({
				metadata: metadata,
			})
			.where(eq(problemTable.problemId, this.problemId));
	}

	public async setType(typeId: number) {
		const contest = await this.getContest();
		const type = await this.db.query.typeTable.findFirst({
			where: eq(typeTable.typeId, typeId),
		});

		if (!type) {
			throw new BadRequestError('Type not found');
		}

		if (type.contestId !== contest.contestId) {
			throw new BadRequestError(
				`Contest for type ${type.typeId} is not the same as contest for problem ${this.problemId}`
			);
		}

		await this.db
			.update(problemTable)
			.set({
				typeId: typeId,
			})
			.where(eq(problemTable.problemId, this.problemId));
	}

	public async setTopics(topics: number[]): Promise<void> {
		// Delete topics designed for deletion
		await this.db
			.delete(problemTopicTable)
			.where(
				and(
					eq(problemTopicTable.problemId, this.problemId),
					notInArray(problemTopicTable.topicId, topics)
				)
			);

		// Add new topics
		if (topics.length > 0) {
			await this.db
				.insert(problemTopicTable)
				.values(
					topics.map((topicId) => ({
						problemId: this.problemId,
						topicId: topicId,
					}))
				)
				.onConflictDoNothing();
		}
	}

	public async setAuthors(
		authors: Partial<Record<AuthorTypeEnum, number[]>>
	) {
		// update authors
		for (const type of authorTypeEnum.enumValues) {
			const personIds = authors[type];

			if (personIds === undefined) {
				continue;
			}

			await this.db
				.delete(authorTable)
				.where(
					and(
						eq(authorTable.problemId, this.problemId),
						eq(authorTable.type, type),
						notInArray(authorTable.personId, personIds)
					)
				);
			if (personIds.length === 0) {
				continue;
			}
			await this.db
				.insert(authorTable)
				.values(
					personIds.map((personId) => ({
						personId: personId,
						problemId: this.problemId,
						type: type,
					}))
				)
				.onConflictDoNothing(); // prevents duplicates because of the unique key in schema
		}
	}

	public async setState(state: ProblemStateEnum): Promise<void> {
		const problem = await this.getProblem();

		if (problem.seriesId !== null) {
			throw new BadRequestError(
				'Problem assigned to series, cannot change state'
			);
		}

		await this.db
			.update(problemTable)
			.set({
				state: state,
			})
			.where(eq(problemTable.problemId, this.problemId));
	}

	public async setContest(contestId: number): Promise<void> {
		const problem = await this.getProblem();

		if (problem.contestId === null) {
			throw new BadRequestError(
				'Cannot reassign contest of this problem'
			);
		}

		await this.db
			.update(problemTable)
			.set({
				contestId: contestId,
			})
			.where(eq(problemTable.problemId, this.problemId));
	}

	public async setSeries(seriesId: number): Promise<void> {
		const lastProblemInSeries = await this.db.query.problemTable.findFirst({
			where: eq(problemTable.seriesId, seriesId),
			orderBy: desc(problemTable.seriesOrder),
		});

		await this.db
			.update(problemTable)
			.set({
				contestId: null,
				seriesId: seriesId,
				seriesOrder:
					// place the problem after the last one in the series
					lastProblemInSeries && lastProblemInSeries.seriesOrder
						? lastProblemInSeries.seriesOrder + 1
						: 1,
			})
			.where(eq(problemTable.problemId, this.problemId));
	}

	public async addDefaultWork(contestSymbol: string): Promise<void> {
		const workConfig = config.contestWork[contestSymbol];
		if (!workConfig) {
			return;
		}

		// Add default (and missing) work to the problem
		const existingWork = new Map<string, Set<string>>();
		for (const workItem of await this.getWork()) {
			const group = existingWork.get(workItem.group ?? '') ?? new Set();
			group.add(workItem.label);
			existingWork.set(workItem.group ?? '', group);
		}

		const newWorkItems = [];
		for (const workGroup of workConfig) {
			for (const workItem of workGroup.items) {
				if (workItem.optional) {
					continue;
				}

				if (
					existingWork.has(workGroup.groupName) &&
					existingWork.get(workGroup.groupName)?.has(workItem.name)
				) {
					continue;
				}

				newWorkItems.push({
					problemId: this.problemId,
					group: workGroup.groupName,
					label: workItem.name,
				});
			}
		}

		await this.db.insert(workTable).values(newWorkItems);
	}

	public async addText(
		type: TextTypeEnum,
		lang: LangEnum,
		contents?: string
	): Promise<void> {
		let byteContents: Uint8Array | null = null;

		if (contents) {
			const taskYDoc = new Y.Doc();
			taskYDoc.getText().insert(0, contents);
			byteContents = Y.encodeStateAsUpdate(taskYDoc);
		}

		await this.db.insert(textTable).values({
			problemId: this.problemId,
			lang: lang,
			type: type,
			contents: byteContents,
		});
	}

	public async addDefaultTexts(taskText: string, taskLang: LangEnum) {
		const taskYDoc = new Y.Doc();
		taskYDoc.getText().insert(0, taskText);

		const contest = await this.getContest();
		const textTypes = config.contestTexts[contest.symbol];
		if (!textTypes) {
			throw new Error(
				`Could not get languages for contest ${contest.symbol}`
			);
		}

		const taskLangs = textTypes['task'];
		if (!taskLangs || !taskLangs.includes(taskLang)) {
			throw new Error(
				`Invalid lang ${taskLang} for text type task for contest ${contest.symbol}`
			);
		}

		// TS cannot infer the key type normally, so it explictly
		// declared
		for (const textType of Object.keys(
			textTypes
		) as (keyof typeof textTypes)[]) {
			const textLangs = textTypes[textType];
			if (!textLangs) {
				continue;
			}
			for (const textLang of textLangs) {
				if (textType === 'task' && textLang === taskLang) {
					await this.addText('task', textLang, taskText);
				} else {
					await this.addText('task', textLang);
				}
			}
		}
	}
}
