import { SeriesForm } from '@client/components/forms/seriesForm';

import { Route } from './+types/contest.series.create';

export default function ContestSeriesCreate({ params }: Route.ComponentProps) {
	return (
		<>
			<h1>Přidat sérii</h1>
			<SeriesForm
				contestSymbol={params.contest}
				contestYear={Number(params.year)}
			/>
		</>
	);
}
