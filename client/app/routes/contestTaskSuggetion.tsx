import { CreateProblemForm } from '~/components/forms/createProblemForm';
import { Route } from './+types/contestTaskSuggetion';
import { trpc } from '~/trpc';

export async function clientLoader() {
	const contests = await trpc.contest.createProblemData.query();
	return contests;
}

export default function ContestTaskSuggestion({
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto">
			<h1>Navrhnout úlohu</h1>
			<CreateProblemForm contests={loaderData} />
		</div>
	);
}
