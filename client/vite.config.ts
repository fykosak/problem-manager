import { reactRouter } from '@react-router/dev/vite';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	css: {
		postcss: {
			plugins: [tailwindcss, autoprefixer],
		},
	},
	plugins: [reactRouter(), tsconfigPaths()],
	ssr: {
		// react-codemirror cannot correctly resolve imports on static page rendering
		// and is not needed anyway
		noExternal: ['@uiw/react-codemirror'],
	},
});
