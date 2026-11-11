import { type TRPC_ERROR_CODE_KEY } from '@trpc/server/rpc';

export enum StatusCode {
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,

	INTERNAL_SERVER_ERROR = 500,
}

export function statusCodeToTRPCCode(code: StatusCode): TRPC_ERROR_CODE_KEY {
	switch (code) {
		case StatusCode.BAD_REQUEST:
			return 'BAD_REQUEST';
		case StatusCode.UNAUTHORIZED:
			return 'UNAUTHORIZED';
		case StatusCode.FORBIDDEN:
			return 'FORBIDDEN';
		case StatusCode.NOT_FOUND:
			return 'NOT_FOUND';
		case StatusCode.INTERNAL_SERVER_ERROR:
			return 'INTERNAL_SERVER_ERROR';
	}
}
