import { SeriesForm } from '@client/components/forms/seriesForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.series.edit';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.series.get.query({
		seriesId: Number(params.seriesId),
	});
	return { series };
}

export default function ContestSeriesCreate({
	loaderData,
	params,
}: Route.ComponentProps) {
	return (
		<>
			<h1>Edit series</h1>
			<SeriesForm
				contestSymbol={params.contest}
				contestYear={Number(params.year)}
				series={loaderData.series}
			/>
		</>
	);
}
