import { Badge } from '@client/components/ui/badge';
import { trpcOutputTypes } from '@client/trpc';

import { Series } from './series';

export function ProblemDashboard({
	series,
}: {
	series: trpcOutputTypes['series']['list'];
}) {
	if (series.length === 0) {
		return <Badge>Žádné série v ročníku</Badge>;
	}
	return (
		<div className="flex flex-col md:flex-row flex-wrap justify-around gap-5">
			{series.map((series) => (
				<Series key={series.seriesId} series={series} />
			))}
		</div>
	);
}
