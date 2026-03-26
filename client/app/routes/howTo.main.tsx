import { DocLink } from '@client/components/docs/docLink';
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
			<div className="flex flex-col items-start gap-2">
				{loaderData.docs.map((docs) => (
					<DocLink
						key={docs.filename}
						filename={docs.filename}
						title={docs.title}
					/>
				))}
			</div>
		</div>
	);
}
