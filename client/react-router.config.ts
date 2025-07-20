import type { Config } from '@react-router/dev/config';

export default {
	// Config options...
	// Server-side render by default, to enable SPA mode set this to `false`
	ssr: false,
	prerender() {
		const markdownFiles = Object.keys(import.meta.glob('./docs/*.md'));
		const pages = markdownFiles.map((file) => {
			const filename = file.split('/').pop()?.replace('.md', '');
			return `/how-to/${filename}`;
		});
		pages.push('/how-to');
		return pages;
	},
} satisfies Config;
