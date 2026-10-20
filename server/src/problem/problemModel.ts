import { and, eq, notInArray } from 'drizzle-orm';

import type { DbConnection } from '@server/db';
import {
	type AuthorTypeEnum,
	authorTable,
	authorTypeEnum,
	problemTable,
	problemTopicTable,
} from '@server/db/schema';

import type { ProblemMetadataType } from './types';

export class ProblemModel {
	private problemId: number;
	private db: DbConnection;

	constructor(db: DbConnection, problemId: number) {
		this.db = db;
		this.problemId = problemId;
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
}
