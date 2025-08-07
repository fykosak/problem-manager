import { TRPCClientError } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { DropdownMenuItem } from '@client/components/ui/dropdown-menu';
import { Form } from '@client/components/ui/form';
import { Loader } from '@client/components/ui/loader';
import { trpc } from '@client/trpc';

import { Task } from './columns';

async function onDeleteProblem(problemId: number) {
	try {
		await trpc.problem.delete.mutate({
			problemId: problemId,
		});
		toast.success('Úloha přesunuta do koše');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Error při mazání úlohy', {
				description: error.message,
			});
		}
	}
}

export function DeleteComponent({
	problem,
	setOpen,
}: {
	problem: Task;
	setOpen: (open: boolean) => void;
}) {
	const deleteForm = useForm();
	const revalidator = useRevalidator();

	if (problem.state !== 'active') {
		return null;
	}

	return (
		<Form {...deleteForm}>
			<DropdownMenuItem
				// eslint-disable-next-line
				onSelect={async (event) => {
					event.preventDefault();
					await deleteForm.handleSubmit(() =>
						onDeleteProblem(problem.problemId)
					)();
					setOpen(false);
					await revalidator.revalidate();
				}}
			>
				{deleteForm.formState.isSubmitting && <Loader />}
				Přesunout do koše
			</DropdownMenuItem>
		</Form>
	);
}
