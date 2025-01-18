import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: 'postgresql',
	casing: 'snake_case',
	dbCredentials: {
		url: 'postgresql://pm:password@db/problem_manager',
	}
});
