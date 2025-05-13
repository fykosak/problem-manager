import { trpc, trpcOutputTypes } from '@client/trpc';

import PersonSelect from './personSelect';

export default function WorkPersonSelect({
	work,
	organizers,
}: {
	work: trpcOutputTypes['problem']['work'][0];
	organizers: trpcOutputTypes['contest']['organizers'];
}) {
	async function updateWorkPerson(personId: number, assigned: boolean) {
		await trpc.work.updatePersonWork.query({
			workId: work.workId,
			personId: personId,
			assigned: assigned,
		});
	}

	return (
		<PersonSelect
			onChange={updateWorkPerson}
			organizers={organizers}
			selected={Array.from(work.people, (person) => person.personId)}
		/>
	);
}
