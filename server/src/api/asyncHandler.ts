import type { NextFunction, Request, Response } from 'express';

/**
 * Async handler for express request handlers that are async.
 * Needed for express to be able to catch errors correctly.
 */
export function asyncHandler(
	callback: (
		req: Request,
		res: Response,
		next: NextFunction
	) => Promise<unknown>
) {
	return function (req: Request, res: Response, next: NextFunction) {
		callback(req, res, next).catch(next);
	};
}
