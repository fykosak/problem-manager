import type { Config } from '@react-router/dev/config';

export default {
	// Server-side render by default, to enable SPA mode set this to `false`
	ssr: false,

	// Prerender /how-to/... paths, so the markdown files don't need to be
	// fetched dynamically on the client. Also it's needed for /how-to
	// access to file system to find all markdown files in /docs directory.
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
