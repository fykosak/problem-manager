import { PublicError } from './publicError';
import { StatusCode } from './statusCodes';

export class NotFoundError extends PublicError {
	getStatusCode(): StatusCode {
		return StatusCode.NOT_FOUND;
	}
}
