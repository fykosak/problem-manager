import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';

import * as schema from '@server/db/schema';

import { TEST_DATABASE_URL } from '../../drizzle.test.config';

export function getTestDb(): NodePgDatabase<typeof schema> {
	return drizzle({
		connection: TEST_DATABASE_URL,
		casing: 'snake_case',
		schema,
	});
}
