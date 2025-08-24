import { and, eq } from 'drizzle-orm';

import { db } from '@server/db';
import {
	contestYearTable,
	problemTable,
	seriesTable,
	textTable,
} from '@server/db/schema';
import { ProblemStorageError } from '@server/runner/problemStorage';
import { releaseText } from '@server/trpc/routers/text';

async function main() {
	if (process.argv.length < 4) {
		console.error('Missing params');
		console.error(
			`Usage: npx tsx tools/batchHtmlExport.ts <contestId> <year>`
		);
		return;
	}

	const contestId = Number(process.argv[2]);
	const year = Number(process.argv[3]);

	const contestYear = await db.query.contestYearTable.findFirst({
		where: and(
			eq(contestYearTable.contestId, contestId),
			eq(contestYearTable.year, year)
		),
	});

	if (!contestYear) {
		console.error('Contest year does not exist');
		return;
	}

	const textsToExport = await db
		.select()
		.from(textTable)
		.innerJoin(
			problemTable,
			eq(textTable.problemId, problemTable.problemId)
		)
		.innerJoin(seriesTable, eq(problemTable.seriesId, seriesTable.seriesId))
		.where(
			and(
				eq(seriesTable.contestYearId, contestYear.contestYearId),
				eq(textTable.type, 'task')
			)
		);

	for (const text of textsToExport) {
		console.log(
			`Exporting text ${text.text.textId} of problem ${text.problem.problemId}`
		);
		try {
			await releaseText(text.text.textId, text.problem.problemId);
		} catch (error) {
			console.error(error);
			if (error instanceof ProblemStorageError) {
				continue;
			}
			return;
		}
	}
}

await main();
