import { relations, sql } from 'drizzle-orm';
import {
	boolean,
	check,
	customType,
	integer,
	json,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Uint8Array }>({
	dataType() {
		return 'bytea';
	},
});

export const contestTable = pgTable('contest', {
	contestId: serial().primaryKey(),
	name: varchar({ length: 255 }).notNull().unique(),
	symbol: varchar({ length: 255 }).notNull().unique(),
});

export const contestRelations = relations(contestTable, ({ many }) => ({
	years: many(contestYearTable),
	topics: many(topicTable),
	types: many(typeTable),
}));

export const contestYearTable = pgTable(
	'contest_year',
	{
		contestYearId: serial().primaryKey(),
		contestId: integer()
			.notNull()
			.references(() => contestTable.contestId),
		year: integer().notNull(),
	},
	(table) => [check('year_check', sql`${table.year} > 0`)]
);

export const contestYearRelations = relations(
	contestYearTable,
	({ one, many }) => ({
		contest: one(contestTable, {
			fields: [contestYearTable.contestId],
			references: [contestTable.contestId],
		}),
		series: many(seriesTable),
	})
);

export const seriesTable = pgTable(
	'series',
	{
		seriesId: serial().primaryKey(),
		contestYearId: integer()
			.notNull()
			.references(() => contestYearTable.contestYearId),
		label: varchar({ length: 255 }).notNull(),
		release: timestamp({ withTimezone: true }),
		deadline: timestamp({ withTimezone: true }),
	},
	(table) => [unique().on(table.contestYearId, table.label)]
);

export const seriesRelations = relations(seriesTable, ({ one, many }) => ({
	problems: many(problemTable),
	contestYear: one(contestYearTable, {
		fields: [seriesTable.contestYearId],
		references: [contestYearTable.contestYearId],
	}),
}));

export const topicTable = pgTable(
	'topic',
	{
		topicId: serial().primaryKey(),
		contestId: integer()
			.notNull()
			.references(() => contestTable.contestId),
		label: varchar({ length: 255 }).notNull(),
		available: boolean().notNull().default(true),
	},
	(table) => [unique().on(table.contestId, table.label)]
);

export const topicRelations = relations(topicTable, ({ one, many }) => ({
	problemTopics: many(problemTopicTable),
	contest: one(contestTable, {
		fields: [topicTable.contestId],
		references: [contestTable.contestId],
	}),
}));

export const problemTopicTable = pgTable(
	'problem_topic',
	{
		problemTopicId: serial().primaryKey(),
		problemId: integer()
			.notNull()
			.references(() => problemTable.problemId, { onDelete: 'cascade' }),
		topicId: integer()
			.notNull()
			.references(() => topicTable.topicId),
	},
	(table) => [unique().on(table.problemId, table.topicId)]
);

export const problemTopicRelations = relations(
	problemTopicTable,
	({ one }) => ({
		problem: one(problemTable, {
			fields: [problemTopicTable.problemId],
			references: [problemTable.problemId],
		}),
		topic: one(topicTable, {
			fields: [problemTopicTable.topicId],
			references: [topicTable.topicId],
		}),
	})
);

export const typeTable = pgTable(
	'type',
	{
		typeId: serial().primaryKey(),
		contestId: integer()
			.notNull()
			.references(() => contestTable.contestId),
		label: varchar({ length: 255 }).notNull(),
		available: boolean().notNull().default(true),
	},
	(table) => [unique().on(table.contestId, table.label)]
);

export const typeRelations = relations(typeTable, ({ one, many }) => ({
	problems: many(problemTable),
	contest: one(contestTable, {
		fields: [typeTable.contestId],
		references: [contestTable.contestId],
	}),
}));

export const problemStateEnum = pgEnum('problem_state', ['active', 'deleted']);

export const problemTable = pgTable(
	'problem',
	{
		problemId: serial().primaryKey(),
		state: problemStateEnum().notNull().default('active'),
		seriesId: integer().references(() => seriesTable.seriesId),
		seriesOrder: integer(),
		contestId: integer().references(() => contestTable.contestId),
		typeId: integer()
			.notNull()
			.references(() => typeTable.typeId),
		metadata: json().notNull().$type<Record<string, unknown>>(),
		created: timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		// Problem is assigned to contest as a proposal or to a series as
		// selected problem, but must be one or the other, not both, not none.
		check(
			'problem_contestId_or_seriesId',
			sql`(${table.seriesId} IS NULL) != (${table.contestId} IS NULL)`
		),
		check(
			'problem_contestId_and_order',
			sql`(${table.seriesId} IS NULL) = (${table.seriesOrder} IS NULL)`
		),
	]
);

export const problemRelations = relations(problemTable, ({ one, many }) => ({
	problemTopics: many(problemTopicTable),
	authors: many(authorTable),
	work: many(workTable),
	series: one(seriesTable, {
		fields: [problemTable.seriesId],
		references: [seriesTable.seriesId],
	}),
	type: one(typeTable, {
		fields: [problemTable.typeId],
		references: [typeTable.typeId],
	}),
	topics: many(problemTopicTable),
	texts: many(textTable),
	contest: one(contestTable, {
		fields: [problemTable.contestId],
		references: [contestTable.contestId],
	}),
}));

export const langEnum = pgEnum('lang', ['cs', 'en']);
export const textTypeEnum = pgEnum('text_type', ['task', 'solution']);

export const textTable = pgTable(
	'text',
	{
		textId: serial().primaryKey(),
		problemId: integer()
			.notNull()
			.references(() => problemTable.problemId),
		lang: langEnum().notNull(),
		type: textTypeEnum().notNull(),
		contents: bytea(),
		html: text(),
	},
	(table) => [unique().on(table.problemId, table.lang, table.type)]
);

export const textRelations = relations(textTable, ({ one, many }) => ({
	problem: one(problemTable, {
		fields: [textTable.problemId],
		references: [problemTable.problemId],
	}),
	contents: many(textVersionTable),
}));

export const textVersionTable = pgTable('text_version', {
	textVersionId: serial().primaryKey(),
	textId: integer()
		.notNull()
		.references(() => textTable.textId),
	contents: text().notNull(),
	personId: integer().references(() => personTable.personId),
	created: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const textContentRelations = relations(textVersionTable, ({ one }) => ({
	person: one(personTable, {
		fields: [textVersionTable.personId],
		references: [personTable.personId],
	}),
	text: one(textTable, {
		fields: [textVersionTable.textId],
		references: [textTable.textId],
	}),
}));

export const personTable = pgTable('person', {
	personId: serial().primaryKey(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	//texSignature: varchar({ length: 255 }).notNull(),
});

export const personRelations = relations(personTable, ({ many }) => ({
	authors: many(authorTable),
	organizers: many(organizerTable),
	apiKeys: many(apiKeyTable),
}));

export const organizerTable = pgTable('organizer', {
	organizerId: serial().primaryKey(),
	personId: integer()
		.notNull()
		.references(() => personTable.personId),
	contestId: integer()
		.notNull()
		.references(() => contestTable.contestId),
	email: varchar().notNull(),
	since: integer().notNull(),
	until: integer(),
});

export const organizerRelations = relations(organizerTable, ({ one }) => ({
	person: one(personTable, {
		fields: [organizerTable.personId],
		references: [personTable.personId],
	}),
	contest: one(contestTable, {
		fields: [organizerTable.contestId],
		references: [contestTable.contestId],
	}),
}));

export const authorTable = pgTable(
	'author',
	{
		authorId: serial().primaryKey(),
		personId: integer()
			.notNull()
			.references(() => personTable.personId),
		problemId: integer()
			.notNull()
			.references(() => problemTable.problemId),
		type: textTypeEnum().notNull(),
	},
	(table) => [unique().on(table.authorId, table.problemId, table.type)]
);

export const authorRelations = relations(authorTable, ({ one }) => ({
	person: one(personTable, {
		fields: [authorTable.personId],
		references: [personTable.personId],
	}),
	problem: one(problemTable, {
		fields: [authorTable.problemId],
		references: [problemTable.problemId],
	}),
}));

export const workStateEnum = pgEnum('work_state', [
	'waiting',
	'todo',
	'pending',
	'done',
]);

export const workTable = pgTable('work', {
	workId: serial().primaryKey(),
	problemId: integer()
		.notNull()
		.references(() => problemTable.problemId),
	label: varchar({ length: 255 }).notNull(),
	group: varchar({ length: 255 }),
	state: workStateEnum().notNull().default('waiting'),
});

export const workRelations = relations(workTable, ({ one, many }) => ({
	problem: one(problemTable, {
		fields: [workTable.problemId],
		references: [problemTable.problemId],
	}),
	people: many(personWorkTable),
}));

export const personWorkTable = pgTable(
	'person_work',
	{
		personWorkId: serial().primaryKey(),
		workId: integer()
			.notNull()
			.references(() => workTable.workId),
		personId: integer()
			.notNull()
			.references(() => personTable.personId),
	},
	(table) => [unique().on(table.personId, table.workId)]
);

export const personWorkRelations = relations(personWorkTable, ({ one }) => ({
	person: one(personTable, {
		fields: [personWorkTable.personId],
		references: [personTable.personId],
	}),
	work: one(workTable, {
		fields: [personWorkTable.workId],
		references: [workTable.workId],
	}),
}));

export const apiKeyTable = pgTable('api_key', {
	apiKeyId: serial().primaryKey(),
	personId: integer()
		.notNull()
		.references(() => personTable.personId),
	key: text().unique().notNull(),
	created: timestamp({ withTimezone: true }).notNull().defaultNow(),
	validUntil: timestamp({ withTimezone: true }),
});

export const apiKeyRelations = relations(apiKeyTable, ({ one }) => ({
	person: one(personTable, {
		fields: [apiKeyTable.personId],
		references: [personTable.personId],
	}),
}));
