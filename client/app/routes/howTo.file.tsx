import fs from 'fs/promises';
import { MoveLeft } from 'lucide-react';
import path from 'node:path';
import Markdown from 'react-markdown';
import { Link } from 'react-router';
import rehypeRaw from 'rehype-raw';
import remarkGFM from 'remark-gfm';

import { Route } from './+types/howTo.file';

export async function loader({ params }: Route.LoaderArgs) {
	const filepath = path.join('./docs/', params.markdownFile + '.md');
	const content = await fs.readFile(filepath, { encoding: 'utf8' });
	return { markdown: content };
}

export default function howToFile({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto mb-8">
			<Link
				to="/how-to"
				className="inline-flex text-muted-foreground gap-2 hover:underline"
			>
				<MoveLeft /> Přehled návodů
			</Link>
			<Markdown
				remarkPlugins={[remarkGFM]}
				rehypePlugins={[rehypeRaw]}
				components={{
					a: (props) => {
						const { node, href, ...rest } = props; // eslint-disable-line
						let transformedHref = href;
						if (href) {
							const match = href.match(/^(\.\/.*)\.md/);
							if (match && match.length >= 2) {
								transformedHref = match[1];
							}
						}
						return (
							<a
								className="text-blue-600 dark:text-blue-500 hover:underline"
								href={transformedHref}
								{...rest}
							/>
						);
					},
					p: (props) => {
						const { node, ...rest } = props; // eslint-disable-line
						return <p className="my-4" {...rest} />;
					},
					ul: (props) => {
						const { node, ...rest } = props; // eslint-disable-line
						return (
							<ul
								className="list-disc list-outside pl-5"
								{...rest}
							/>
						);
					},
					code: (props) => {
						const { node, ...rest } = props; // eslint-disable-line
						return (
							<code
								className="bg-muted rounded-md p-1 text-sm"
								{...rest}
							/>
						);
					},
				}}
			>
				{loaderData.markdown}
			</Markdown>
		</div>
	);
}
