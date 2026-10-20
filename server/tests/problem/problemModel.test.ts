import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
	authorTable,
	contestTable,
	personTable,
	problemTable,
	problemTopicTable,
	topicTable,
	typeTable,
} from '@server/db/schema';
import { ProblemModel } from '@server/problem/problemModel';
import { getTestDb } from '@server/tests/db/testDb';

const db = getTestDb();

// automatic unique labels
let seq = 0;
const nextLabel = (base: string) => `${base}_${++seq}`;

async function insertContest() {
	const label = nextLabel('contest');
	const [contest] = await db
		.insert(contestTable)
		.values({ name: `Test Contest ${label}`, symbol: label })
		.returning();
	return contest;
}

async function insertType(contestId: number) {
	const [type] = await db
		.insert(typeTable)
		.values({ contestId, label: nextLabel('Type') })
		.returning();
	return type;
}

async function insertProblem(typeId: number, contestId: number) {
	const [problem] = await db
		.insert(problemTable)
		.values({ typeId, contestId, metadata: {} })
		.returning();
	return problem;
}

async function insertTopic(contestId: number) {
	const [topic] = await db
		.insert(topicTable)
		.values({ contestId, label: nextLabel('Topic') })
		.returning();
	return topic;
}

async function insertPerson() {
	const [person] = await db
		.insert(personTable)
		.values({ firstName: 'John', lastName: 'Doe' })
		.returning();
	return person;
}

// ─── Teardown ─────────────────────────────────────────────────────────────

async function truncateTables() {
	// Delete children before parents to satisfy FK constraints
	await db.delete(authorTable);
	await db.delete(problemTopicTable);
	await db.delete(problemTable);
	await db.delete(topicTable);
	await db.delete(typeTable);
	await db.delete(personTable);
	await db.delete(contestTable);
}

describe('ProblemModel', () => {
	// shared values between tests
	let contestId: number;
	let typeId: number;
	let problemId: number;
	let problemModel: ProblemModel;

	beforeEach(async () => {
		const contest = await insertContest();
		const type = await insertType(contest.contestId);
		const problem = await insertProblem(type.typeId, contest.contestId);
		contestId = contest.contestId;
		typeId = type.typeId;
		problemId = problem.problemId;
		problemModel = new ProblemModel(db, problemId);
	});

	afterEach(async () => {
		await truncateTables();
	});

	describe('setMetadata', () => {
		it('update type and metadata', async () => {
			const type2 = await insertType(contestId);
			const newMeta = { name: { cs: 'Nový název', en: 'New name' } };
			await problemModel.setMetadata(newMeta, type2.typeId);

			const [updated] = await db
				.select()
				.from(problemTable)
				.where(eq(problemTable.problemId, problemId));

			expect(updated.metadata).toEqual(newMeta);
			expect(updated.typeId).toBe(type2.typeId);
		});
	});

	describe('setTopics', () => {
		it('add missing topics', async () => {
			const topic = await insertTopic(contestId);
			await problemModel.setTopics([topic.topicId]);

			const rows = await db
				.select()
				.from(problemTopicTable)
				.where(eq(problemTopicTable.problemId, problemId));

			expect(rows).toHaveLength(1);
			expect(rows[0].topicId).toBe(topic.topicId);
		});

		it('removes topics missing in the new list', async () => {
			const topic1 = await insertTopic(contestId);
			const topic2 = await insertTopic(contestId);

			await db.insert(problemTopicTable).values([
				{ problemId, topicId: topic1.topicId },
				{ problemId, topicId: topic2.topicId },
			]);

			// Keep only topic2
			await problemModel.setTopics([topic2.topicId]);

			const rows = await db
				.select()
				.from(problemTopicTable)
				.where(eq(problemTopicTable.problemId, problemId));

			expect(rows).toHaveLength(1);
			expect(rows[0].topicId).toBe(topic2.topicId);
		});

		it('do not duplicate saved topics', async () => {
			const topic = await insertTopic(contestId);

			await db
				.insert(problemTopicTable)
				.values({ problemId, topicId: topic.topicId });

			await problemModel.setTopics([topic.topicId]); // same topic again

			const rows = await db
				.select()
				.from(problemTopicTable)
				.where(eq(problemTopicTable.problemId, problemId));

			expect(rows).toHaveLength(1);
		});

		it('removes all topics', async () => {
			const topic = await insertTopic(contestId);

			await db
				.insert(problemTopicTable)
				.values({ problemId, topicId: topic.topicId });

			await problemModel.setTopics([]);

			const rows = await db
				.select()
				.from(problemTopicTable)
				.where(eq(problemTopicTable.problemId, problemId));

			expect(rows).toHaveLength(0);
		});
	});

	describe('setAuthors', () => {
		it('insert authors', async () => {
			const person = await insertPerson();
			await problemModel.setAuthors({ task: [person.personId] });

			const rows = await db
				.select()
				.from(authorTable)
				.where(eq(authorTable.problemId, problemId));

			expect(rows).toHaveLength(1);
			expect(rows[0].personId).toBe(person.personId);
			expect(rows[0].type).toBe('task');
		});

		it('removes authors', async () => {
			const p1 = await insertPerson();
			const p2 = await insertPerson();

			await db.insert(authorTable).values([
				{ personId: p1.personId, problemId, type: 'task' },
				{ personId: p2.personId, problemId, type: 'task' },
			]);

			// Keep only p1
			await problemModel.setAuthors({ task: [p1.personId] });

			const rows = await db
				.select()
				.from(authorTable)
				.where(eq(authorTable.problemId, problemId));

			expect(rows).toHaveLength(1);
			expect(rows[0].personId).toBe(p1.personId);
		});

		it('change authors of specific type', async () => {
			const p1 = await insertPerson();
			const p2 = await insertPerson();

			// Set solution author
			await db.insert(authorTable).values({
				personId: p2.personId,
				problemId,
				type: 'solution',
			});

			// Change task author
			await problemModel.setAuthors({ task: [p1.personId] });

			const rows = await db
				.select()
				.from(authorTable)
				.where(eq(authorTable.problemId, problemId));

			expect(rows).toHaveLength(2);
		});

		it('non-duplicate authors', async () => {
			const person = await insertPerson();

			await db.insert(authorTable).values({
				personId: person.personId,
				problemId,
				type: 'task',
			});

			await problemModel.setAuthors({ task: [person.personId] }); // same person again

			const rows = await db
				.select()
				.from(authorTable)
				.where(eq(authorTable.problemId, problemId));

			expect(rows).toHaveLength(1);
		});

		it('removes authors', async () => {
			const person = await insertPerson();

			await db.insert(authorTable).values({
				personId: person.personId,
				problemId,
				type: 'task',
			});

			await problemModel.setAuthors({ task: [] });

			const rows = await db
				.select()
				.from(authorTable)
				.where(eq(authorTable.problemId, problemId));

			expect(rows).toHaveLength(0);
		});
	});
});
