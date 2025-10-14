import { TRPCClientError } from '@trpc/client';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@client/components/ui/button';
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@client/components/ui/dialog';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Task } from './columns';

async function assignProblemToSeries(seriesId: number, problemId: number) {
	try {
		await trpc.problem.assignSeries.mutate({
			problemId,
			seriesId,
		});
		toast.success('Úloha přidána do série');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Úlohu se nepodařilo přiřadit', {
				description: error.message,
			});
		}
	}
}

export function SelectSeriesComponent({
	series,
	problem,
	setOpen,
}: {
	series: trpcOutputTypes['series']['list'];
	problem: Task;
	setOpen: (open: boolean) => void;
}) {
	const revalidator = useRevalidator();

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Select series</DialogTitle>
				<DialogDescription>
					Vyberte sérii, do které chcete úlohu přiřadit
				</DialogDescription>
			</DialogHeader>
			<div className="grid grid-cols-3 gap-4 items-center">
				{series.map((series) => (
					<Button
						key={series.seriesId}
						variant="outline"
						// eslint-disable-next-line
						onClick={async () => {
							await assignProblemToSeries(
								series.seriesId,
								problem.problemId
							);
							setOpen(false);
							await revalidator.revalidate();
						}}
					>
						{series.label}
					</Button>
				))}
			</div>
		</DialogContent>
	);
}
