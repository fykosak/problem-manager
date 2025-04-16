import { WebTextsList } from '@client/components/tasks/webTexts/webTextsList';
import { trpc } from '@client/trpc';

import { Route } from './+types/task.webTexts';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const texts = await trpc.problem.texts.query({
		problemId: Number(params.taskId),
	});
	return { texts };
}

export default function WebTexts({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto px-4 sm:px-6 lg:px-8">
			<h1>Zveřejnění textů na web</h1>
			<WebTextsList texts={loaderData.texts} />
		</div>
	);
}
