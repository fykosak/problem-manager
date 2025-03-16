import { initTRPC } from '@trpc/server';

import type { Context } from '@server/trpc/context';

export const trpc = initTRPC.context<Context>().create();
