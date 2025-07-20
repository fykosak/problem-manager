import fs from 'fs/promises';
import path from 'node:path';
import { Link } from 'react-router';

import { Button } from '@client/components/ui/button';

import { Route } from './+types/howTo.main';

export async function loader() {
	const files = import.meta.glob('../../docs/*.md');
	const links = [];

	for (const file in files) {
		const filename = file.split('/').pop();
		if (!filename) {
			continue;
		}
		const filepath = path.join('./docs/', filename);
		let fileTitle = filename;

		// set first found markdown title as page title if possible
		const content = await fs.readFile(filepath, { encoding: 'utf8' });
		const titleMatch = content.match(/^#+ (.*)$/m);
		if (titleMatch && titleMatch.length >= 2) {
			fileTitle = titleMatch[1]; // get first group match
		}

		links.push({
			filename: filename,
			title: fileTitle,
		});
	}

	return { links };
}

export default function howTo({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto mb-8">
			<h1>Přehled návodů</h1>
			<div className="flex flex-col items-start">
				{loaderData.links.map((link) => (
					<Button variant="ghost" asChild>
						<Link
							to={'/how-to/' + link.filename.replace('.md', '')}
						>
							{link.title}
						</Link>
					</Button>
				))}
			</div>
		</div>
	);
}
