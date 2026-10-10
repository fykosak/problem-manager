import { Problem } from './types';

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
