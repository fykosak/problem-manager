import { VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '~/lib/utils';

const textareaVariants = cva(
	'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
	{
		variants: {
			size: {
				default: 'min-h-[60px]',
				lg: 'min-h-[120px]',
			},
		},
		defaultVariants: {
			size: 'default',
		},
	}
);

export interface TextareaProps
	extends React.ComponentProps<'textarea'>,
		VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, size, ...props }, ref) => {
		return (
			<textarea
				className={cn(textareaVariants({ size }), className)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Textarea.displayName = 'Textarea';

export { Textarea };
