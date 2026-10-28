import type { StatusCode } from './statusCodes';

export abstract class PublicError extends Error {
	abstract getStatusCode(): StatusCode;
}
