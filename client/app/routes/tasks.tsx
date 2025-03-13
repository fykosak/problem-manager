import { TaskDashboard } from '@client/components/tasks/taskDashboard';
import { Button } from '@client/components/ui/button';
import { useUserRoles } from '@client/hooks/usePersonRoles';
import { acl } from '@server/acl/aclFactory';
import { Route } from './+types/tasks';

export default function Tasks({ params }: Route.ComponentProps) {
	const roles = useUserRoles();
	return (
		<>
			{acl.isAllowed(
				roles.contestRole[params.contest],
				'series',
				'edit'
			) && <Button>Edit</Button>}
			<TaskDashboard />
		</>
	);
}
