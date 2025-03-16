import { trpcOutputTypes } from '@client/trpc';

import { Problem } from './problem';

export function Series({
	series,
}: {
	series: trpcOutputTypes['contest']['series'][0];
}) {
	return (
		<div className="md:w-80">
			<h2>série {series.label}</h2>
			<div className="flex flex-col gap-2">
				{series.problems.map((problem) => (
					<Problem key={problem.problemId} problem={problem} />
				))}
			</div>
		</div>
	);
}
