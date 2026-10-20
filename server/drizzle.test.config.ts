import { defineConfig } from 'drizzle-kit';

const url =
	process.env.TEST_DATABASE_URL ??
	'postgresql://pm:password@db/problem_manager_test';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: { url },
});
