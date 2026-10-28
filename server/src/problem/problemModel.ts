import { and, asc, desc, eq, notInArray } from 'drizzle-orm';

import config from '@server/config/config';
import type { DbConnection } from '@server/db';
import {
	type AuthorTypeEnum,
	type ProblemStateEnum,
	type TextTypeEnum,
	authorTable,
	authorTypeEnum,
	problemTable,
	problemTopicTable,
	textTable,
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

	public async setMetadata(
		metadata: ProblemMetadataType,
		type: number
	): Promise<void> {
		// TODO Validate metadata shape
		await this.db
			.update(problemTable)
			.set({
				metadata: metadata,
				typeId: type,
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

	public async assignDefaultWork(contestSymbol: string): Promise<void> {
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
}
