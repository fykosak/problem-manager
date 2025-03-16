import { Link } from 'react-router';

import { Badge } from '@client/components/ui/badge';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@client/components/ui/card';
import { ProgressWork } from '@client/components/ui/progressWork';
import { trpcOutputTypes } from '@client/trpc';

export function Problem({
	problem,
}: {
	problem: trpcOutputTypes['contest']['series'][0]['problems'][0];
}) {
	const workStats = new Map<string, number>();
	for (const work of problem.work) {
		const currentCount = workStats.get(work.state) ?? 0;
		workStats.set(work.state, currentCount + 1);
	}

	return (
		<Card className="hover:bg-accent">
			<CardHeader>
				<CardTitle className="flex flex-row justify-between items-center gap-2">
					<Link to={'task/' + problem.problemId}>
						{'name' in problem.metadata
							? // @ts-expect-error not defined metadata type
								'cs' in problem.metadata.name
								? (problem.metadata.name.cs as string) // TODO
								: ''
							: ''}
					</Link>
					<Badge className="bg-green-500">{problem.type.label}</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ProgressWork workStats={workStats} />
			</CardContent>
		</Card>
	);
}
