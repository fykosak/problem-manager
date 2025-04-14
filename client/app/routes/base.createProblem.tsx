import { CreateProblemForm } from '@client/components/forms/createProblemForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/base.createProblem';

export async function clientLoader() {
	const contests = await trpc.contest.createProblemData.query();
	return contests;
}

export default function ContestTaskCreate({
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto">
			<h1>Navrhnout úlohu</h1>
			<CreateProblemForm contestData={loaderData} />
		</div>
	);
}
