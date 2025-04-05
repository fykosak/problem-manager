import { cn } from '@client/lib/utils';
import { trpcOutputTypes } from '@client/trpc';

import { WebTextItem } from './webTextItem';

export function WebTextsList({
	texts,
	className,
}: {
	texts: trpcOutputTypes['problem']['texts'];
	className?: string;
}) {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{texts.map((text) => (
				<WebTextItem key={text.textId} text={text} />
			))}
		</div>
	);
}
