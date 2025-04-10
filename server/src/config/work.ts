import { z } from 'zod';

import { ConfigError } from './configUtils';

const workSchema = z.record(
	z.string().nonempty(),
	z
		.object({
			groupName: z
				.string({
					invalid_type_error: 'Work group name must be a string',
					required_error: 'Work group name is required',
				})
				.nonempty('Group name must not be empty'),
			items: z
				.object({
					name: z
						.string({
							invalid_type_error:
								'Work item name must be a string',
							required_error: 'Work item name is required',
						})
						.nonempty(),
					optional: z.boolean().optional().default(false),
				})
				.array(),
		})
		.array()
);

export function getWorkConfig(json: Record<string, unknown>, property: string) {
	const workConfig = json[property];
	if (typeof workConfig !== 'object') {
		throw new ConfigError('Work config is not an object');
	}

	return workSchema.parse(workConfig);
}
