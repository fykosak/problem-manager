import { type InferSelectModel, and, eq } from 'drizzle-orm';

import { db } from '@server/db';
import { contestTable, organizerTable, personTable } from '@server/db/schema';

import { FKSDBUserAdapter } from './fksdbUserAdapter';
import type { User } from './userAdapter';

const adapter = new FKSDBUserAdapter();

function objectsEqual(
	a: Record<string, unknown>,
	b: Record<string, unknown>
): boolean {
	if (Object.keys(a).length !== Object.keys(b).length) {
		return false;
	}

	for (const key in a) {
		if (a[key] !== b[key]) {
			return false;
		}
	}

	return true;
}

async function processPerson(
	importedPerson: User,
	dbPerson: InferSelectModel<typeof personTable> | undefined
) {
	const importedPersonData = {
		personId: importedPerson.personId,
		firstName: importedPerson.firstName,
		lastName: importedPerson.lastName,
	};
	if (!dbPerson || !objectsEqual(dbPerson, importedPersonData)) {
		// create or update person if missing or the values differ
		await db
			.insert(personTable)
			.values(importedPersonData)
			.onConflictDoUpdate({
				target: personTable.personId,
				set: importedPersonData,
			});
	}
}

async function processOrganizer(
	importedOrganizer: User['organizers'][0],
	dbOrganizer: InferSelectModel<typeof organizerTable> | undefined,
	contestId: number,
	personId: number
) {
	const importedPersonData = {
		contestId: contestId,
		personId: personId,
		email: importedOrganizer.email,
		since: importedOrganizer.since,
		until: importedOrganizer.until,
	};

	if (!dbOrganizer) {
		await db.insert(organizerTable).values(importedPersonData);
		return;
	}

	const importedOrganizerDataForUpdate = {
		organizerId: dbOrganizer.organizerId,
		...importedPersonData,
	};

	if (objectsEqual(dbOrganizer, importedOrganizerDataForUpdate)) {
		return;
	}

	await db
		.update(organizerTable)
		.set(importedOrganizerDataForUpdate)
		.where(eq(organizerTable.organizerId, dbOrganizer.organizerId));
}

async function importUsers() {
	const people = await adapter.getUserData();

	for (const importedPerson of people) {
		const dbPerson = await db.query.personTable.findFirst({
			where: eq(personTable.personId, importedPerson.personId),
		});

		await processPerson(importedPerson, dbPerson);

		for (const importedOrganizer of importedPerson.organizers) {
			const dbContest = await db.query.contestTable.findFirst({
				where: eq(contestTable.symbol, importedOrganizer.contestSymbol),
			});
			if (!dbContest) {
				throw new Error('Contest does not exist');
			}

			// selecting organizer by contest symbol
			// to not hardcode contests ids
			const dbOrganizer = await db.query.organizerTable.findFirst({
				where: and(
					eq(organizerTable.personId, importedPerson.personId),
					eq(organizerTable.contestId, dbContest.contestId)
				),
			});

			await processOrganizer(
				importedOrganizer,
				dbOrganizer,
				dbContest.contestId,
				importedPerson.personId
			);
		}
	}
}

await importUsers();
