import { type DefaultErrorShape, TRPCError } from '@trpc/server';
import { type TRPCErrorShape, TRPC_ERROR_CODES_BY_KEY } from '@trpc/server/rpc';

import { PublicError } from '@server/errors/publicError';
import { statusCodeToTRPCCode } from '@server/errors/statusCodes';

export class ErrorHandler {
	public static format({
		shape,
		error,
		path,
	}: {
		shape: DefaultErrorShape;
		error: TRPCError;
		path: string | undefined;
	}): TRPCErrorShape {
		console.log('TRPC error', path, error);

		// public errors - send message
		if (error.cause instanceof PublicError) {
			return {
				...shape,
				code: TRPC_ERROR_CODES_BY_KEY[
					statusCodeToTRPCCode(error.cause.getStatusCode())
				],
				message: error.message,
				data: {},
			};
		}

		// generic error - send a generic message
		return {
			...shape,
			message:
				'Error on the server has occurred, report it to administrators',
			data: {
				...shape.data,
				stack: undefined,
			},
		};
	}
}
