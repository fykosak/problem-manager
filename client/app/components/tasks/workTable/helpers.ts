import { Problem, Work, WorkConfig, WorkGroupConfig } from './types';

export function getWorkGroups(
	problems: Problem[],
	workConfig: WorkConfig | undefined
): WorkGroupConfig[] {
	const actualGroups = new Map<string | null, Work[]>();
	for (const problem of problems) {
		for (const work of problem.work) {
			const works = actualGroups.get(work.group) ?? [];
			works.push(work);
			actualGroups.set(work.group, works);
		}
	}

	const groups: WorkGroupConfig[] = (workConfig ?? []).map(
		(configuredGroup) => ({
			groupName: configuredGroup.groupName,
			items: configuredGroup.items,
		})
	);
	const configuredNames = new Set(groups.map((group) => group.groupName));

	for (const [groupName, works] of actualGroups) {
		if (configuredNames.has(groupName)) continue;
		groups.push({
			groupName,
			items: Array.from(
				new Map(works.map((work) => [work.label, work]))
			).map(([name]) => ({ name, optional: false })),
		});
	}

	return groups;
}

export function getProblemName(metadata: Problem['metadata']) {
	if (
		'name' in metadata &&
		metadata.name &&
		typeof metadata.name === 'object' &&
		'cs' in metadata.name &&
		typeof metadata.name.cs === 'string'
	) {
		return metadata.name.cs;
	}
	return 'chybí název';
}
