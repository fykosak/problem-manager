import { eq } from 'drizzle-orm';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
import {
	createAuthedTrpcContext,
	createTestCaller,
} from '@server/tests/trpc/testContext';
import { problemRouter } from '@server/trpc/routers/problemRouter';

import { getTestDb } from '../db/testDb';

const db = getTestDb();

const contestSymbol = 'trpc-test';
const roleNames = {
	organizer: 'test-organizer',
	manager: 'test-manager',
};

async function truncateTables() {
	await db.delete(authorTable);
	await db.delete(problemTopicTable);
	await db.delete(textTable);
	await db.delete(workTable);
	await db.delete(problemTable);
	await db.delete(topicTable);
	await db.delete(typeTable);
	await db.delete(seriesTable);
	await db.delete(contestYearTable);
	await db.delete(personTable);
	await db.delete(contestTable);
}

let contest: typeof contestTable.$inferSelect;
let otherContest: typeof contestTable.$inferSelect;
let person: typeof personTable.$inferSelect;
let problem: typeof problemTable.$inferSelect;
let type: typeof typeTable.$inferSelect;
let topic: typeof topicTable.$inferSelect;
let series: typeof seriesTable.$inferSelect;

function caller(role: string) {
	return createTestCaller(
		problemRouter,
		createAuthedTrpcContext(person.personId, [role])
	);
}

describe('problemRouter', () => {
	beforeAll(truncateTables);

	beforeEach(async () => {
		[contest] = await db
			.insert(contestTable)
			.values({ name: contestSymbol, symbol: contestSymbol })
			.returning();
		[otherContest] = await db
			.insert(contestTable)
			.values({ name: 'trpc-test-other', symbol: 'trpc-test-other' })
			.returning();
		[person] = await db
			.insert(personTable)
			.values({ firstName: 'Test', lastName: 'Person' })
			.returning();
		[type] = await db
			.insert(typeTable)
			.values({ contestId: contest.contestId, label: 'test' })
			.returning();
		[topic] = await db
			.insert(topicTable)
			.values({ contestId: contest.contestId, label: 'test' })
			.returning();
		const [contestYear] = await db
			.insert(contestYearTable)
			.values({ contestId: contest.contestId, year: 1 })
			.returning();
		[series] = await db
			.insert(seriesTable)
			.values({ contestYearId: contestYear.contestYearId, label: 'test' })
			.returning();
		[problem] = await db
			.insert(problemTable)
			.values({
				contestId: contest.contestId,
				typeId: type.typeId,
				metadata: {},
			})
			.returning();
	});

	afterEach(truncateTables);

	it('problem information', async () => {
		await expect(
			caller(roleNames.organizer).info({
				problemId: problem.problemId,
			})
		).resolves.toMatchObject({
			problemId: problem.problemId,
			contestId: contest.contestId,
			typeId: type.typeId,
		});
	});

	it('metadata, topics, type, and authors', async () => {
		await db
			.update(problemTable)
			.set({ metadata: { name: { en: 'Example' } } })
			.where(eq(problemTable.problemId, problem.problemId));
		await db.insert(problemTopicTable).values({
			problemId: problem.problemId,
			topicId: topic.topicId,
		});
		await db.insert(authorTable).values({
			problemId: problem.problemId,
			personId: person.personId,
			type: 'concept',
		});
		await expect(
			caller(roleNames.organizer).metadata({
				problemId: problem.problemId,
			})
		).resolves.toMatchObject({
			metadata: { name: { en: 'Example' } },
			topics: [topic.topicId],
			type: type.typeId,
			authors: { concept: [person.personId] },
		});
	});

	it('problem text of type', async () => {
		await db.insert(textTable).values({
			problemId: problem.problemId,
			lang: 'en',
			type: 'task',
		});

		await expect(
			caller(roleNames.organizer).texts({
				problemId: problem.problemId,
				textType: 'task',
			})
		).resolves.toMatchObject([
			{ problemId: problem.problemId, lang: 'en', type: 'task' },
		]);
	});

	it('problem work', async () => {
		await db.insert(workTable).values({
			problemId: problem.problemId,
			group: 'review',
			label: 'Review',
		});

		await expect(
			caller(roleNames.organizer).work({
				problemId: problem.problemId,
			})
		).resolves.toMatchObject([
			{
				problemId: problem.problemId,
				group: 'review',
				label: 'Review',
			},
		]);
	});

	it('create problem', async () => {
		const created = await caller(roleNames.organizer).create({
			contestSymbol,
			lang: 'en',
			name: 'New problem',
			task: 'Task text',
			topics: [topic.topicId],
			type: type.typeId,
			result: { value: 42, unit: 'points' },
		});

		await expect(
			caller(roleNames.organizer).metadata({
				problemId: created.problemId,
			})
		).resolves.toMatchObject({
			metadata: {
				name: { en: 'New problem' },
				result: { value: 42, unit: 'points' },
			},
			topics: [topic.topicId],
			type: type.typeId,
			authors: { concept: [person.personId] },
		});
		await expect(
			caller(roleNames.organizer).texts({
				problemId: created.problemId,
				textType: 'task',
			})
		).resolves.toMatchObject([
			{
				problemId: created.problemId,
				lang: 'en',
				type: 'task',
			},
		]);
	});

	it('add work', async () => {
		await caller(roleNames.organizer).addWork({
			problemId: problem.problemId,
			newWork: [{ group: 'review', label: 'Check' }],
		});

		await expect(
			caller(roleNames.organizer).work({
				problemId: problem.problemId,
			})
		).resolves.toMatchObject([
			{
				problemId: problem.problemId,
				group: 'review',
				label: 'Check',
			},
		]);
	});

	it('update metadata', async () => {
		await caller(roleNames.organizer).updateMetadata({
			problemId: problem.problemId,
			metadata: { title: 'Updated' },
			topics: [topic.topicId],
			type: type.typeId,
			authors: { concept: [person.personId] },
		});

		await expect(
			caller(roleNames.organizer).metadata({
				problemId: problem.problemId,
			})
		).resolves.toMatchObject({
			metadata: { title: 'Updated' },
			topics: [topic.topicId],
			type: type.typeId,
			authors: { concept: [person.personId] },
		});
	});

	it('change state', async () => {
		await expect(
			caller(roleNames.manager).changeState({
				problemId: problem.problemId,
				state: 'deleted',
			})
		).resolves.toBeUndefined();

		await expect(
			db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, problem.problemId),
			})
		).resolves.toMatchObject({ state: 'deleted' });
	});

	it('change contest', async () => {
		await expect(
			caller(roleNames.manager).changeContest({
				problemId: problem.problemId,
				contestId: otherContest.contestId,
			})
		).resolves.toBeUndefined();

		await expect(
			db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, problem.problemId),
			})
		).resolves.toMatchObject({ contestId: otherContest.contestId });
	});

	it('assigns to a series', async () => {
		await expect(
			caller(roleNames.manager).assignSeries({
				problemId: problem.problemId,
				seriesId: series.seriesId,
			})
		).resolves.toBeUndefined();

		await expect(
			db.query.problemTable.findFirst({
				where: eq(problemTable.problemId, problem.problemId),
			})
		).resolves.toMatchObject({
			contestId: null,
			seriesId: series.seriesId,
			seriesOrder: 1,
		});
	});
});
