import Editor from '~/components/editor/editor';
import { Route } from './+types/task.edit';
import { trpc } from '~/trpc';
import TaskPdf from '~/components/editor/taskPdf';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	return await trpc.problem.texts.query(parseInt(params.taskId));
}

export default function TaskEdit({ loaderData }: Route.ComponentProps) {
	const text = loaderData[0];
	return (
		<div className="flex flex-col md:flex-row">
			<Editor textId={1601} />
			<TaskPdf />
		</div>
	); // TODO get text id from problem
}
