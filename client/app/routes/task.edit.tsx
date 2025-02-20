import Editor from '~/components/editor/editor';
import { Route } from './+types/task.edit';
import { trpc } from '~/trpc';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	return await trpc.problem.texts.query(parseInt(params.taskId));
}

export default function TaskEdit({ loaderData }: Route.ComponentProps) {
	const text = loaderData[0];
	return <Editor textId={1601} />; // TODO get text id from problem
}
