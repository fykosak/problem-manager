import { PublicError } from './publicError';
import { StatusCode } from './statusCodes';

export class BadRequestError extends PublicError {
	getStatusCode(): StatusCode {
		return StatusCode.BAD_REQUEST;
	}
}
