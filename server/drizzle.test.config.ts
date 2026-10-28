import { defineConfig } from 'drizzle-kit';

export const TEST_DATABASE_URL =
	process.env.TEST_DATABASE_URL ??
	'postgresql://pm:password@db/problem_manager_test';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: { url: TEST_DATABASE_URL },
});
