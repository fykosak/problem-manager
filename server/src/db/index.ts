import { drizzle } from 'drizzle-orm/node-postgres';

import config from '@server/config';

import * as schema from './schema';

export const db = drizzle({
	connection: config.dbConnection,
	casing: 'snake_case',
	schema,
});
