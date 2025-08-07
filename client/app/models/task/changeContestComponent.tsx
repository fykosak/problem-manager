import { acl } from '@server/acl/aclFactory';

import {
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from '@client/components/ui/dropdown-menu';
import { usePersonRoles } from '@client/hooks/usePersonRoles';
import { trpcOutputTypes } from '@client/trpc';

import { Task } from './columns';

export function ChangeContestComponent({
	problem,
	contests: availableContests,
}: {
	problem: Task;
	contests: trpcOutputTypes['getContests'];
}) {
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
			<DropdownMenuSubTrigger>Změnit seminář</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent>
					{availableContests
						.filter(
							(contest) => contest.symbol != problem.contestSymbol
						)
						.map((contest) => (
							<DropdownMenuItem>{contest.name}</DropdownMenuItem>
						))}
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>
	);
}
