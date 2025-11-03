import { type InferSelectModel, eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import { db } from '@server/db';
import {
	apiKeyTable,
	contestTable,
	organizerTable,
	personTable,
} from '@server/db/schema';

export type RequestPerson = InferSelectModel<typeof personTable> & {
	organizers: (InferSelectModel<typeof organizerTable> & {
		contest: InferSelectModel<typeof contestTable>;
	})[];
};

export async function UserAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const apiKeyHeader = req.header('X-API-Key') ?? req.query.key;
	if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
		res.status(400).send('X-API-Key header missing');
		return;
	}

	const apiKey = await db.query.apiKeyTable.findFirst({
		where: eq(apiKeyTable.key, apiKeyHeader),
	});

	if (!apiKey || (apiKey.validUntil && apiKey.validUntil < new Date())) {
		res.status(401).send('Invalid API key');
		return;
	}

	const person = await db.query.personTable.findFirst({
		where: eq(personTable.personId, apiKey.personId),
		with: {
			organizers: {
				with: {
					contest: true,
				},
			},
		},
	});

	if (!person) {
		res.status(401).send('Person not found');
		return;
	}

	res.locals.person = person;

	next();
}
