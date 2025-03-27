import { FileList } from '@client/components/tasks/files/fileList';
import { FileUploadForm } from '@client/components/tasks/files/fileUploadForm';
import { trpc } from '@client/trpc';

import { Route } from './+types/task.files';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const problemId = Number(params.taskId);
	const files = await trpc.problem.files.list.query(problemId);
	return { files };
}

export default function TaskFiles({
	params,
	loaderData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto px-4 sm:px-6 lg:px-8">
			<h1>Files</h1>
			<FileUploadForm problemId={Number(params.taskId)} />
			<FileList
				problemId={Number(params.taskId)}
				files={loaderData.files}
				className="py-5"
			/>
		</div>
	);
}
