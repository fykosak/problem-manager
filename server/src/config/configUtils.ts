export class ConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ConfigError';
	}
}

export function getRequiredString(
	json: Record<string, unknown>,
	property: string
): string {
	const propertyValue = json[property];
	if (!propertyValue) {
		throw new ConfigError(`Config value ${property} not specified`);
	}
	if (typeof propertyValue !== 'string') {
		throw new ConfigError(`Config value ${property} is not a string`);
	}
	return propertyValue;
}
