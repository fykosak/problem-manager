import { EditorLayout } from '@client/components/editor/editorLayout';
import { trpc, type trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/task.edit';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	const texts = await trpc.problem.texts.query({
		taskId: parseInt(params.taskId),
	});

	const textsById = new Map<number, trpcOutputTypes['problem']['texts'][0]>();
	const textsByType = new Map<string, trpcOutputTypes['problem']['texts']>();

	for (const text of texts) {
		textsById.set(text.textId, text);

		const textsOfSameType = textsByType.get(text.type) ?? [];
		textsOfSameType.push(text);
		textsByType.set(text.type, textsOfSameType);
	}

	return { textsById, textsByType };
}

export default function TaskEdit({ loaderData, params }: Route.ComponentProps) {
	return (
		<EditorLayout problemId={Number(params.taskId)} textData={loaderData} />
	);
}
