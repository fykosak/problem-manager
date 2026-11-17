import { initTRPC } from '@trpc/server';

import type { Context } from '@server/trpc/context';

import { ErrorHandler } from './errorHandler';

export const trpc = initTRPC.context<Context>().create({
	errorFormatter: (opts) => ErrorHandler.format(opts),
});
