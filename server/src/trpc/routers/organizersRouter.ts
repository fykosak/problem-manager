import { TRPCError } from '@trpc/server';

import { acl } from '@server/acl/aclFactory';
import { importUsers } from '@server/userAdapter/userImporter';

import { authedProcedure } from '../middleware';
import { trpc } from '../trpc';

export const organizersRouter = trpc.router({
	import: authedProcedure.mutation(async ({ ctx }) => {
		if (!acl.isAllowedBase(ctx.aclRoles, 'organizers', 'import')) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
			});
		}

		await importUsers();
	}),
});
