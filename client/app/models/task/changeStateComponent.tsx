import { TRPCClientError } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { DropdownMenuItem } from '@client/components/ui/dropdown-menu';
import { Form } from '@client/components/ui/form';
import { Loader } from '@client/components/ui/loader';
import { trpc } from '@client/trpc';

import { Task } from './columns';

async function onChangeProblemState(problem: Task) {
	try {
		const targetState = problem.state === 'active' ? 'deleted' : 'active';

		await trpc.problem.changeState.mutate({
			problemId: problem.problemId,
			state: targetState,
		});
		switch (problem.state) {
			case 'active':
				toast.success('Úloha vytáhnuta z koše');
				break;
			case 'deleted':
				toast.success('Úloha přesunuta do koše');
				break;
		}
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Error při změně stavu úlohy', {
				description: error.message,
			});
		}
	}
}

export function ChangeStateComponent({
	problem,
	setOpen,
}: {
	problem: Task;
	setOpen: (open: boolean) => void;
}) {
	const changeStateForm = useForm();
	const revalidator = useRevalidator();

	return (
		<Form {...changeStateForm}>
			<DropdownMenuItem
				// eslint-disable-next-line
				onSelect={async (event) => {
					event.preventDefault();
					await changeStateForm.handleSubmit(() =>
						onChangeProblemState(problem)
					)();
					setOpen(false);
					await revalidator.revalidate();
				}}
			>
				{changeStateForm.formState.isSubmitting && <Loader />}
				{problem.state === 'active'
					? 'Přesunout do koše'
					: 'Vytáhnout z koše'}
			</DropdownMenuItem>
		</Form>
	);
}
