import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	test: {},
	resolve: {
		alias: [
			{ find: '@server', replacement: resolve(__dirname, './src') },
			{
				find: '@server/tests',
				replacement: resolve(__dirname, './tests'),
			},
		],
	},
});
