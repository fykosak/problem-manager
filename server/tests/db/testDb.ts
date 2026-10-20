import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';

import * as schema from '@server/db/schema';

const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	'postgresql://pm:password@db/problem_manager_test';

export function getTestDb(): NodePgDatabase<typeof schema> {
	return drizzle({
		connection: TEST_DATABASE_URL,
		casing: 'snake_case',
		schema,
	});
}
