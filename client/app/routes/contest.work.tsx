import { SeriesTables } from '@client/components/tasks/workTable/seriesTables';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@client/components/ui/tabs';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.work';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const series = await trpc.series.list.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});
	const [workConfig, metadataFields] = await Promise.all([
		trpc.contest.availableWork.query({ contestSymbol: params.contest }),
		trpc.contest.metadataFields.query({ contestSymbol: params.contest }),
	]);
	return { series, workConfig, metadataFields };
}

export default function Work({ loaderData }: Route.ComponentProps) {
	const series = loaderData.series;
	const workConfig = loaderData.workConfig;
	const metadataFields = loaderData.metadataFields;

	return (
		<>
			<h1>Přehled korektur</h1>
			<Tabs defaultValue={series[0]?.seriesId.toString()}>
				<TabsList className="mb-4 flex h-auto flex-wrap justify-start">
					{series.map((currentSeries) => (
						<TabsTrigger
							key={currentSeries.seriesId}
							value={currentSeries.seriesId.toString()}
						>
							Série {currentSeries.label}
						</TabsTrigger>
					))}
				</TabsList>
				{series.map((currentSeries) => (
					<TabsContent
						key={currentSeries.seriesId}
						value={currentSeries.seriesId.toString()}
					>
						<SeriesTables
							series={currentSeries}
							workConfig={workConfig}
							metadataFields={metadataFields}
						/>
					</TabsContent>
				))}
			</Tabs>
		</>
	);
}
