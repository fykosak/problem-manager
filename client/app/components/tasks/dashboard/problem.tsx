import { Link } from 'react-router';

import { Badge } from '@client/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { ProgressWork } from '@client/components/ui/progressWork';
import { trpcOutputTypes } from '@client/trpc';

export function Problem({
	problem,
}: {
	problem: trpcOutputTypes['series']['list'][0]['problems'][0];
}) {
	const workStats = new Map<string, number>();
	for (const work of problem.work) {
		const currentCount = workStats.get(work.state) ?? 0;
		workStats.set(work.state, currentCount + 1);
	}

	return (
		<Card>
			<CardHeader className="p-4">
				<CardTitle className="flex flex-row justify-between items-center gap-2">
					<Link
						to={'task/' + problem.problemId}
						className="hover:underline"
					>
						{'name' in problem.metadata
							? // @ts-expect-error not defined metadata type
								'cs' in problem.metadata.name
								? (problem.metadata.name.cs as string) // TODO
								: ''
							: ''}
					</Link>
					<Badge className="bg-green-500 text-background">
						{problem.type.label}
					</Badge>
				</CardTitle>
				<CardDescription>úloha {problem.seriesOrder}</CardDescription>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<ProgressWork workStats={workStats} />
			</CardContent>
		</Card>
	);
}
