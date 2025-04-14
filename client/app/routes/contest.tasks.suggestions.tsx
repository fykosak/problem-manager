import { Plus } from 'lucide-react';
import { NavLink } from 'react-router';
import { useNavigate } from 'react-router';

import { Button } from '@client/components/ui/button';
import { DataTable } from '@client/components/ui/dataTable';
import { Task, getColumns } from '@client/models/task/columns';
import { trpc } from '@client/trpc';

import { Route } from './+types/contest.tasks.suggestions';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const problems = await trpc.contest.problemSuggestions.query({
		contestSymbol: params.contest,
	});

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

	const series = await trpc.series.list.query({
		contestSymbol: params.contest,
		contestYear: Number(params.year),
	});

	return { problems: transformedProblems, series };
}

export default function TaskSuggestions({ loaderData }: Route.ComponentProps) {
	const navigate = useNavigate();

	return (
		<>
			<div className="my-5">
				<Button asChild>
					<NavLink to={'../tasks/create'}>
						<Plus /> Navrhnout úlohu
					</NavLink>
				</Button>
			</div>
			<DataTable
				columns={getColumns(loaderData.series)}
				data={loaderData.problems}
				getOnRowClick={(row) => () =>
					navigate('../task/' + row.original.problemId)
				}
			/>
		</>
	);
}
