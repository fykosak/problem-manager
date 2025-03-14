import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@client/lib/utils';
import { workStateEnum } from '@server/db/schema';
import { getWorkStateColor, getWorkStateLabel } from '../tasks/workComponent';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip';

function ProgressWork({
	className,
	workStats,
	...props
}: {
	className?: string;
	workStats: Map<string, number>;
}) {
	const numberOfWorks = Array.from(workStats.values()).reduce(
		(sum, statCount) => (sum += statCount),
		0
	);
	let runningSum = 0;

	return (
		<ProgressPrimitive.Root
			className={cn(
				'relative h-2 w-full overflow-hidden rounded-full bg-primary/20 relative',
				className
			)}
			{...props}
		>
			{workStateEnum.enumValues.toReversed().map((workState) => {
				const workStateCount = workStats.get(workState) ?? 0;
				const width = workStateCount / numberOfWorks;
				// translate percentage is relative to element width, so it
				// needs to by scaled by 1/width to get the correct relative
				// translate inside of parent
				const translateX = (runningSum / numberOfWorks) * (1 / width);
				runningSum = runningSum + workStateCount;
				return (
					<TooltipProvider key={workState}>
						<Tooltip>
							<TooltipTrigger asChild>
								<ProgressPrimitive.Indicator
									className={`h-full flex-1 ${getWorkStateColor(workState)} transition-all absolute`}
									style={{
										width: `${100 * width}%`,
										transform: `translateX(${100 * translateX}%)`,
									}}
								/>
							</TooltipTrigger>
							<TooltipContent>
								{getWorkStateLabel(workState)} ({workStateCount}
								/{numberOfWorks})
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				);
			})}
		</ProgressPrimitive.Root>
	);
}
ProgressWork.displayName = ProgressPrimitive.Root.displayName;

export { ProgressWork };
