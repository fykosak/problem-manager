'use client';

import { type VariantProps, cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@client/lib/utils';

const labelVariants = cva('animate-spin');

const Loader = React.forwardRef<
	React.ElementRef<typeof LoaderCircle>,
	React.ComponentPropsWithoutRef<typeof LoaderCircle> &
		VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<LoaderCircle
		ref={ref}
		className={cn(labelVariants(), className)}
		{...props}
	/>
));
Loader.displayName = LoaderCircle.displayName;

export { Loader };
