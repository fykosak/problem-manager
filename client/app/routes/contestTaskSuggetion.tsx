import { CreateProblemForm } from '@client/components/forms/createProblemForm';
import { Route } from './+types/contestTaskSuggetion';
import { trpc } from '@client/trpc';

export async function clientLoader() {
	const contests = await trpc.contest.createProblemData.query();
	return contests;
}

export default function ContestTaskSuggestion({
	params,
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto">
			<h1>Navrhnout úlohu</h1>
			<CreateProblemForm
				currentContestSymbol={params.contest}
				contests={loaderData}
			/>
		</div>
	);
}
