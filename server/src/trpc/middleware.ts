import { TRPCError } from '@trpc/server';
import { trpc } from './trpc';

export const protectedProcedure = trpc.procedure.use(({ ctx, next }) => {
	if (!ctx.jwtData) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}

	// TODO get user from database

	// TODO check user is organizer

	return next({
		ctx: {
			...ctx,
		},
	});
});
