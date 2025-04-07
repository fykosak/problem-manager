import { defineConfig } from 'drizzle-kit';

import config from '@server/config';

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: {
		url: config.dbConnection,
	},
});
