import { Link } from 'react-router';

import { Button } from '@client/components/ui/button';
import { getAvailableDocs } from '@client/models/howTo';

import { Route } from './+types/howTo.main';

// HowTo is statically prerendered -> it can use loader and access files on
// server.
export async function loader() {
	return { docs: await getAvailableDocs() };
}

export default function howTo({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto mb-8">
			<h1>Přehled návodů</h1>
			<div className="flex flex-col items-start">
				{loaderData.docs.map((docs) => (
					<Button variant="ghost" asChild>
						<Link
							to={'/how-to/' + docs.filename.replace('.md', '')}
						>
							{docs.title}
						</Link>
					</Button>
				))}
			</div>
		</div>
	);
}
