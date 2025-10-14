import { and, eq } from 'drizzle-orm';
import * as path from 'path';

import { db } from '@server/db';
import { contestYearTable, problemTable, seriesTable } from '@server/db/schema';
import { ProblemStorage } from '@server/runner/problemStorage';
import { Runner } from '@server/runner/runner';

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

	const problems = await db
		.select()
		.from(problemTable)
		.innerJoin(seriesTable, eq(problemTable.seriesId, seriesTable.seriesId))
		.where(eq(seriesTable.contestYearId, contestYear.contestYearId));

	for (const problem of problems) {
		try {
			const problemStorage = new ProblemStorage(
				problem.problem.problemId
			);
			const sourceFiles = await problemStorage.getFiles();
			const exportedFiles = await problemStorage.getExportedFiles();

			const runner = new Runner(problem.problem.problemId);

			for (const file of sourceFiles) {
				const basename = path.parse(file).name;
				if (
					exportedFiles.find(
						(exportedFile) =>
							path.parse(exportedFile).name === basename
					)
				) {
					continue;
				}

				console.log(
					`File ${file} missing, problem ${problem.problem.problemId}`
				);

				const filepath = problemStorage.getPathForFile(file);
				await runner.exportFile(filepath);
			}
		} catch (error) {
			console.error(error);
		}
	}
}

await main();
