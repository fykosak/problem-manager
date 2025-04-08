import { CreateProblemForm } from '@client/components/forms/createProblemForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.tasks.create';

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
				contestData={loaderData}
			/>
		</div>
	);
}
