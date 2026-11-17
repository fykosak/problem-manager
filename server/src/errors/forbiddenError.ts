import { PublicError } from './publicError';
import { StatusCode } from './statusCodes';

export class ForbiddenError extends PublicError {
	getStatusCode(): StatusCode {
		return StatusCode.FORBIDDEN;
	}
}
