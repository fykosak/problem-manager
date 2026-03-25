import { MoveLeft } from 'lucide-react';
import { Link } from 'react-router';

import { DocLink } from '@client/components/docs/docLink';
import { MarkdownText } from '@client/components/docs/markdown';
import { getAvailableDocs, getDocContent } from '@client/models/howTo';

import { Route } from './+types/howTo.file';

export async function loader({ params }: Route.LoaderArgs) {
	return {
		docs: await getAvailableDocs(),
		markdown: await getDocContent(params.markdownFile),
	};
}

export default function howToFile({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-lg mx-auto mb-8">
			<Link
				to="/how-to"
				className="inline-flex text-muted-foreground gap-2 hover:underline"
			>
				<MoveLeft /> Přehled návodů
			</Link>

			<div className="flex flex-col md:flex-row gap-8">
				<aside className="flex-shrink-0 hidden md:block">
					<nav className="sticky top-8 gap-2 flex flex-col items-start">
						{loaderData.docs.map((docs) => (
							<DocLink
								filename={docs.filename}
								title={docs.title}
							/>
						))}
					</nav>
				</aside>
				<main className="flex-1 min-w-0">
					<MarkdownText>{loaderData.markdown}</MarkdownText>
				</main>
			</div>
		</div>
	);
}
