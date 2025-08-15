import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@client/lib/utils';

const fieldSetVariants = cva(
	'rounded-lg border bg-card text-card-foreground shadow-sm p-4',
	{
		variants: {
			variant: {
				default: '',
				ghost: 'border-none shadow-none',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

export interface FieldSetRootProps
	extends React.HTMLAttributes<HTMLFieldSetElement>,
		VariantProps<typeof fieldSetVariants> {}

const FieldSetRoot = React.forwardRef<HTMLFieldSetElement, FieldSetRootProps>(
	({ className, variant, ...props }, ref) => {
		return (
			<fieldset
				ref={ref}
				className={cn(fieldSetVariants({ variant }), className)}
				{...props}
			/>
		);
	}
);
FieldSetRoot.displayName = 'FieldSetRoot';

const FieldSetContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div ref={ref} className={cn('m-2 space-y-8', className)} {...props} />
	);
});
FieldSetContent.displayName = 'FieldSetContent';

const FieldSetFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	return (
		<div
			ref={ref}
			className={cn('border-t border-inherit px-6 py-3', className)}
			{...props}
		/>
	);
});
FieldSetFooter.displayName = 'FieldSetFooter';

export interface FieldSetTitleProps
	extends React.HTMLAttributes<HTMLLegendElement> {
	level?: number;
}

const FieldSetTitle = React.forwardRef<HTMLLegendElement, FieldSetTitleProps>(
	({ className, level = 3, ...props }, ref) => {
		return (
			<legend
				ref={ref}
				role="heading"
				aria-level={level}
				className={cn(
					'px-2 text-xl font-semibold tracking-tight',
					className
				)}
				{...props}
			/>
		);
	}
);
FieldSetTitle.displayName = 'FieldSetTitle';

export {
	FieldSetRoot,
	FieldSetContent,
	FieldSetFooter,
	FieldSetTitle,
	fieldSetVariants,
};
