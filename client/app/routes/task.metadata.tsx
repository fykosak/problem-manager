import { MetadataForm } from '@client/components/forms/metadataForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/task.metadata';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const data = await Promise.all([
		trpc.problem.metadata.query(parseInt(params.taskId)),
		trpc.contest.topics.query({
			contestSymbol: params.contest,
		}),
		trpc.contest.types.query({
			contestSymbol: params.contest,
		}),
		trpc.contest.organizers.query({
			contestSymbol: params.contest,
		}),
		trpc.contest.metadataFields.query({
			contestSymbol: params.contest,
		}),
	]);
	return {
		taskData: data[0],
		topics: data[1],
		types: data[2],
		organizers: data[3],
		metadataFields: data[4],
	};
}

export default function Metadata({ params, loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto px-4 sm:px-6 lg:px-8 mb-4">
			<h1>Info o úloze</h1>
			<MetadataForm
				problemId={parseInt(params.taskId)}
				taskData={loaderData.taskData}
				types={loaderData.types}
				topics={loaderData.topics}
				organizers={loaderData.organizers}
				metadataFields={loaderData.metadataFields}
			/>
		</div>
	);
}
