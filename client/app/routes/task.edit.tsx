import { EditorLayout } from '@client/components/editor/editorLayout';

import { Route } from './+types/task.edit';

export default function TaskEdit({ params }: Route.ComponentProps) {
	return <EditorLayout problemId={Number(params.taskId)} />;
}
