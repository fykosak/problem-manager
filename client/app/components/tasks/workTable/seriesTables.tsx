import { getWorkGroups } from './helpers';
import { MetadataTable } from './metadataTable';
import { MetadataField, Series, WorkConfig, WorkRow } from './types';
import { WorkGroupTable } from './workGroupTable';

export function SeriesTables({
	series,
	workConfig,
	metadataFields,
}: {
	series: Series;
	workConfig: WorkConfig | undefined;
	metadataFields: MetadataField[];
}) {
	const rowsByGroup = new Map<string | null, WorkRow[]>();

	for (const problem of series.problems) {
		for (const work of problem.work) {
			const rows = rowsByGroup.get(work.group) ?? [];
			const row = rows.find(
				({ problem: rowProblem }) =>
					rowProblem.problemId === problem.problemId
			);
			if (row) {
				row.works.push(work);
			} else {
				rows.push({ problem, works: [work] });
			}
			rowsByGroup.set(work.group, rows);
		}
	}

	return (
		<>
			{getWorkGroups(series.problems, workConfig).map(
				(configuredGroup) => {
					const rows = rowsByGroup.get(configuredGroup.groupName);
					if (!rows?.length) return null;
					return (
						<WorkGroupTable
							key={configuredGroup.groupName}
							group={configuredGroup.groupName}
							rows={rows}
							items={configuredGroup.items}
						/>
					);
				}
			)}
			<MetadataTable series={series} fields={metadataFields} />
		</>
	);
}
