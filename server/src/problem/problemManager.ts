import type { DbConnection } from '@server/db';
import { problemTable } from '@server/db/schema';

export class ProblemManager {
	public static async create(
		db: DbConnection,
		contestId: number,
		typeId: number
	) {
		const [problem] = await db
			.insert(problemTable)
			.values({
				typeId: typeId,
				contestId: contestId,
				metadata: {},
			})
			.returning();

		return problem;
	}
}
