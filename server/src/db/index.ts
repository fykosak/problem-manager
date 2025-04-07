import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema';
import config from '@server/config';

export const db = drizzle({
	connection: config.dbConnection,
	casing: 'snake_case',
	schema,
});
