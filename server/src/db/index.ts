import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const db = drizzle({
	connection: 'postgresql://pm:password@db/problem_manager',
	casing: 'snake_case',
	schema,
});
