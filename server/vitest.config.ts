import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {},
	resolve: {
		alias: [
			{ find: '@server', replacement: resolve(__dirname, './src') },
			{
				find: '@server/tests',
				replacement: resolve(__dirname, './tests'),
			},
			{
				find: '@latex',
				replacement: resolve(__dirname, '../lang-latex/dist'),
			},
		],
	},
});
