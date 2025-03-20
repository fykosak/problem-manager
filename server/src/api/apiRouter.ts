import { eq } from 'drizzle-orm';
import express from 'express';

import { db } from '@server/db';
import { problemTable } from '@server/db/schema';
import { ProblemStorage } from '@server/runner/problemStorage';

export const apiRouter = express.Router();

// TODO add user authentication

// eslint-disable-next-line
apiRouter.post('/files/upload', async (req, res) => {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send('No files provided');
	}

	if (!('files' in req.files)) {
		return res.status(400).send('Files not provided');
	}

	let files = req.files.files;
	if (!Array.isArray(files)) {
		files = [files];
	}

	// eslint-disable-next-line
	const problemIdString = req.body.problemId as string;
	if (!problemIdString) {
		return res.status(400).send('ProblemId not provided');
	}
	const problemId = Number(problemIdString);

	const problem = await db.query.problemTable.findFirst({
		where: eq(problemTable.problemId, problemId),
	});
	if (!problem) {
		return res.status(400).send('Problem does not exist');
	}

	// TODO check for user permissions

	const problemStorage = new ProblemStorage(problemId);
	for (const file of files) {
		await file.mv(problemStorage.getPathForFile(file.name));
	}

	res.sendStatus(200);
});
