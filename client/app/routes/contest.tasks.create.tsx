import { CreateProblemForm } from '@client/components/forms/createProblemForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.tasks.create';

export async function clientLoader() {
	const data = await Promise.all([
		await trpc.contest.createProblemData.query(),
		await trpc.getContests.query(),
	]);

	return {
		contestCreateProblemData: data[0],
		availableContests: data[1],
	};
}

export default function ContestTaskCreate({
	params,
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto">
			<h1>Navrhnout úlohu</h1>
			<CreateProblemForm
				currentContestSymbol={params.contest}
				currentContestYear={Number(params.year)}
				contestCreateProblemData={loaderData.contestCreateProblemData}
				availableContests={loaderData.availableContests}
			/>
		</div>
	);
}
