import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
	authorTable,
	contestTable,
	contestYearTable,
	personTable,
	problemTable,
	problemTopicTable,
	seriesTable,
	textTable,
	topicTable,
	typeTable,
	workTable,
} from '@server/db/schema';
import { BadRequestError } from '@server/errors/badRequestError';
import { NotFoundError } from '@server/errors/notFoundError';
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

async function insertContestYear(contestId: number) {
	const [contestYear] = await db
		.insert(contestYearTable)
		.values({ contestId, year: 1 })
		.returning();
	return contestYear;
}

async function insertType(contestId: number) {
	const [type] = await db
		.insert(typeTable)
		.values({ contestId, label: nextLabel('type') })
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

async function insertSeries(contestYearId: number) {
	const [series] = await db
		.insert(seriesTable)
		.values({ contestYearId, label: nextLabel('series') })
		.returning();
	return series;
}

async function insertTopic(contestId: number) {
	const [topic] = await db
		.insert(topicTable)
		.values({ contestId, label: nextLabel('topic') })
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
	await db.delete(seriesTable);
	await db.delete(contestYearTable);
	await db.delete(personTable);
	await db.delete(contestTable);
}

describe('ProblemModel', () => {
	// shared values between tests
	let contestId: number;
	let problemId: number;
	let problemModel: ProblemModel;

	beforeEach(async () => {
		const contest = await insertContest();
		const type = await insertType(contest.contestId);
		const problem = await insertProblem(type.typeId, contest.contestId);
		contestId = contest.contestId;
		problemId = problem.problemId;
		problemModel = new ProblemModel(db, problemId);
	});

	afterEach(async () => {
		await truncateTables();
	});

	describe('getProblem', () => {
		it('returns problem', async () => {
			const problem = await problemModel.getProblem();

			expect(problem.problemId).toBe(problemId);
			expect(problem.contest?.contestId).toBe(contestId);
		});

		it('throw NotFoundError', async () => {
			await expect(new ProblemModel(db, -1).getProblem()).rejects.toThrow(
				NotFoundError
			);
		});
	});

	describe('getMetadata', () => {
		it('problem metadata', async () => {
			const metadata = { title: 'Test problem' };
			const topic = await insertTopic(contestId);
			const person = await insertPerson();
			await db
				.update(problemTable)
				.set({ metadata })
				.where(eq(problemTable.problemId, problemId));
			await db.insert(problemTopicTable).values({
				problemId,
				topicId: topic.topicId,
			});
			await db.insert(authorTable).values({
				personId: person.personId,
				problemId,
				type: 'task',
			});

			const result = await problemModel.getMetadata();

			expect(result?.metadata).toEqual(metadata);
			expect(result?.topics).toHaveLength(1);
			expect(result?.topics[0].topicId).toBe(topic.topicId);
			expect(result?.authors).toHaveLength(1);
			expect(result?.authors[0].personId).toBe(person.personId);
		});
	});

	describe('getTexts', () => {
		it('filter and order texts', async () => {
			await db.insert(textTable).values([
				{ problemId, lang: 'en', type: 'task' },
				{ problemId, lang: 'cs', type: 'task' },
				{ problemId, lang: 'cs', type: 'solution' },
			]);

			const texts = await problemModel.getTexts('task');

			expect(texts.map(({ lang, type }) => [lang, type])).toEqual([
				['cs', 'task'],
				['en', 'task'],
			]);
		});
	});

	describe('getWork', () => {
		it('work items in insertion order', async () => {
			await db.insert(workTable).values([
				{ problemId, label: 'Second' },
				{ problemId, label: 'First' },
			]);

			const work = await problemModel.getWork();

			expect(work.map(({ label }) => label)).toEqual(['Second', 'First']);
		});
	});

	describe('getContest', () => {
		it('contest for suggested problems', async () => {
			const contest = await problemModel.getContest();

			expect(contest.contestId).toBe(contestId);
		});

		it('contest for series problems', async () => {
			const contestYear = await insertContestYear(contestId);
			const series = await insertSeries(contestYear.contestYearId);
			await db
				.update(problemTable)
				.set({
					contestId: null,
					seriesId: series.seriesId,
					seriesOrder: 1,
				})
				.where(eq(problemTable.problemId, problemId));

			const contest = await problemModel.getContest();

			expect(contest.contestId).toBe(contestId);
		});

		it('throw NotFoundError', async () => {
			await expect(new ProblemModel(db, -1).getContest()).rejects.toThrow(
				NotFoundError
			);
		});
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

	describe('setState', () => {
		it('suggested problem', async () => {
			await problemModel.setState('deleted');

			const [updated] = await db
				.select()
				.from(problemTable)
				.where(eq(problemTable.problemId, problemId));

			expect(updated.state).toBe('deleted');
		});

		it('reject change if in series', async () => {
			const contestYear = await insertContestYear(contestId);
			const series = await insertSeries(contestYear.contestYearId);
			await db
				.update(problemTable)
				.set({
					contestId: null,
					seriesId: series.seriesId,
					seriesOrder: 1,
				})
				.where(eq(problemTable.problemId, problemId));

			await expect(problemModel.setState('deleted')).rejects.toThrow(
				BadRequestError
			);
		});
	});

	describe('setContest', () => {
		it('suggested problem', async () => {
			const newContest = await insertContest();

			await problemModel.setContest(newContest.contestId);

			const [updated] = await db
				.select()
				.from(problemTable)
				.where(eq(problemTable.problemId, problemId));

			expect(updated.contestId).toBe(newContest.contestId);
		});

		it('reject change if in series', async () => {
			const contestYear = await insertContestYear(contestId);
			const series = await insertSeries(contestYear.contestYearId);
			await db
				.update(problemTable)
				.set({
					contestId: null,
					seriesId: series.seriesId,
					seriesOrder: 1,
				})
				.where(eq(problemTable.problemId, problemId));

			await expect(problemModel.setContest(contestId)).rejects.toThrow(
				BadRequestError
			);
		});
	});

	describe('setSeries', () => {
		it('assigns the first problem in a series order 1', async () => {
			const contestYear = await insertContestYear(contestId);
			const series = await insertSeries(contestYear.contestYearId);

			await problemModel.setSeries(series.seriesId);

			const [updated] = await db
				.select()
				.from(problemTable)
				.where(eq(problemTable.problemId, problemId));
			expect(updated.seriesId).toBe(series.seriesId);
			expect(updated.seriesOrder).toBe(1);
			expect(updated.contestId).toBeNull();
		});

		it('appends after the last ordered problem in a series', async () => {
			const contestYear = await insertContestYear(contestId);
			const series = await insertSeries(contestYear.contestYearId);
			const otherProblem = await insertProblem(
				(await insertType(contestId)).typeId,
				contestId
			);
			await db
				.update(problemTable)
				.set({
					contestId: null,
					seriesId: series.seriesId,
					seriesOrder: 3,
				})
				.where(eq(problemTable.problemId, otherProblem.problemId));

			await problemModel.setSeries(series.seriesId);

			const [updated] = await db
				.select()
				.from(problemTable)
				.where(eq(problemTable.problemId, problemId));
			expect(updated.seriesOrder).toBe(4);
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
