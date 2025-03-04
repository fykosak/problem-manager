import { Button } from '@client/components/ui/button';
import { DataTable } from '@client/components/ui/dataTable';
import { Task, columns } from '@client/models/task/columns';
import { trpc } from '@client/trpc';
import { Route } from './+types/taskSuggestions';
import { NavLink } from 'react-router';
import { Plus } from 'lucide-react';

export async function clientLoader() {
	const problems = await trpc.getProblems.query(1);

	// map to shape
	const transformedProblems: Task[] = problems.map((problem) => ({
		problemId: problem.problemId,
		name:
			'name' in problem.metadata
				? // @ts-expect-error not defined metadata type
					'cs' in problem.metadata.name
					? (problem.metadata.name.cs as string) // TODO
					: ''
				: '',
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
	if (!loaderData) {
		return <div>Failed to load problem data</div>;
	}
	return (
		<>
			<div className="py-5">
				<Button asChild>
					<NavLink to={'../create'}>
						<Plus /> Navrhnout úlohu
					</NavLink>
				</Button>
			</div>
			<DataTable columns={columns} data={loaderData} />
		</>
	);
}
