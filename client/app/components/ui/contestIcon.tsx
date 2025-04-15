import { cn } from '@client/lib/utils';

export function ContestIcon({
	contestSymbol,
	className,
}: {
	contestSymbol: string;
	className?: string;
}) {
	return (
		<img
			src={'/logos/' + contestSymbol + '.svg'}
			className={cn('size-8', className)}
		/>
	);
}
