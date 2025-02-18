import { Button } from '~/components/ui/button';
import { DataTable } from '~/components/ui/dataTable';
import { Task, columns } from '~/models/task/columns';
import { trpc } from '~/trpc';
import { Route } from './+types/taskSuggestions';

export async function clientLoader({}: Route.ClientActionArgs) {
	const problems = await trpc.getProblems.query(1);

	// map to shape
	const transformedProblems: Array<Task> = problems.map((problem) => ({
		problemId: problem.problemId,
		name: problem.metadata.name.cs,
		authors: problem.authors.map(
			(author) => author.person.firstName + ' ' + author.person.lastName
		), // TODO
		problemTopics: problem.problemTopics.map(
			(problemTopic) => problemTopic.topic.label
		),
		type: problem.type.label,
		state: problem.state,
		created: new Date(problem.created),
	}));

	return transformedProblems;
}

export default function TaskSuggestions({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<div className="py-5">
				<Button>+ Navrhnout úlohu</Button>
			</div>
			<DataTable columns={columns} data={loaderData} />
		</>
	);
}
