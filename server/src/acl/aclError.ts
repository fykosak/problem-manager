export class AclError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AclError';
	}
}
