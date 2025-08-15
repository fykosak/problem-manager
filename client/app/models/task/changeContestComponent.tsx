import { TRPCClientError } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { acl } from '@server/acl/aclFactory';

import {
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from '@client/components/ui/dropdown-menu';
import { Loader } from '@client/components/ui/loader';
import { usePersonRoles } from '@client/hooks/usePersonRoles';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Task } from './columns';

async function onChangeContest(problemId: number, contestId: number) {
	try {
		await trpc.problem.changeContest.mutate({
			problemId: problemId,
			contestId: contestId,
		});
		toast.success('Úloha přesunuta do jiné soutěže');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Error při mazání úlohy', {
				description: error.message,
			});
		}
	}
}

export function ChangeContestComponent({
	problem,
	contests,
	setOpen,
}: {
	problem: Task;
	contests: trpcOutputTypes['getContests'];
	setOpen: (open: boolean) => void;
}) {
	const changeForm = useForm();
	const revalidator = useRevalidator();

	const roles = usePersonRoles();
	if (
		!acl.isAllowedContest(
			roles,
			problem.contestSymbol,
			'problem',
			'changeContest'
		)
	) {
		return null;
	}

	return (
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				{changeForm.formState.isSubmitting && <Loader />}
				Změnit soutěž
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					{contests
						.filter(
							(contest) => contest.symbol != problem.contestSymbol
						)
						.map((contest) => (
							<DropdownMenuItem
								// eslint-disable-next-line
								onSelect={async (event) => {
									event.preventDefault();
									await changeForm.handleSubmit(() =>
										onChangeContest(
											problem.problemId,
											contest.contestId
										)
									)();
									setOpen(false);
									await revalidator.revalidate();
								}}
							>
								{contest.name}
							</DropdownMenuItem>
						))}
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	);
}
