import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { TRPCClientError } from '@trpc/client';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@client/components/ui/alert-dialog';
import { Button, buttonVariants } from '@client/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTrigger,
} from '@client/components/ui/dialog';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
} from '@client/components/ui/form';
import { Loader } from '@client/components/ui/loader';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@client/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@client/components/ui/tooltip';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/user.apiKeys';

export async function clientLoader() {
	const keys = await trpc.person.apiKey.list.query();
	return { keys };
}

enum ValidForPeriod {
	day = 'Day',
	week = 'Week',
	month = 'Month',
	year = 'Year',
	forever = 'Forever',
}

async function createKey(validForPeriod: ValidForPeriod) {
	try {
		let validUntil: Date | null = new Date();
		switch (validForPeriod) {
			case ValidForPeriod.forever:
				validUntil = null;
				break;
			case ValidForPeriod.day:
				validUntil.setDate(validUntil.getDate() + 1);
				break;
			case ValidForPeriod.week:
				validUntil.setDate(validUntil.getDate() + 7);
				break;
			case ValidForPeriod.month:
				validUntil.setMonth(validUntil.getMonth() + 1);
				break;
			case ValidForPeriod.year:
				validUntil.setFullYear(validUntil.getFullYear() + 1);
				break;
		}

		await trpc.person.apiKey.create.mutate({
			validUntil: validUntil,
		});

		toast.success('Key created');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Error occured while creating key', {
				description: error.message,
			});
		}
	}
}

async function invalidateKey(apiKeyId: number) {
	try {
		await trpc.person.apiKey.invalidate.mutate({
			apiKeyId: apiKeyId,
		});
		toast.success('Key invalidated');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Error occured while invalidating', {
				description: error.message,
			});
		}
	}
}

function InvalidateDialog({
	apiKey,
}: {
	apiKey: trpcOutputTypes['person']['apiKey']['list'][0];
}) {
	const revalidator = useRevalidator();
	return (
		<AlertDialog>
			<AlertDialogTrigger
				className={buttonVariants({
					variant: 'destructive',
					size: 'icon',
				})}
			>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Trash />
						</TooltipTrigger>
						<TooltipContent>Invalidate</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Invalidate API key</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to invalidate{' '}
						<span className="font-mono">
							{apiKey.key.slice(0, 8)}...
						</span>
						?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						// eslint-disable-next-line
						onClick={async () => {
							await invalidateKey(apiKey.apiKeyId);
							await revalidator.revalidate();
						}}
					>
						Invalidate
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const newKeyFormSchema = z.object({
	validUntil: z.nativeEnum(ValidForPeriod),
});

function NewKeyDialog() {
	const form = useForm<z.infer<typeof newKeyFormSchema>>({
		resolver: zodResolver(newKeyFormSchema),
		defaultValues: {
			validUntil: ValidForPeriod.day,
		},
	});

	const [open, setOpen] = useState(false);
	const revalidator = useRevalidator();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Generate new key</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new API key</DialogTitle>
					<DialogDescription>
						Select the period for which the API key will be valid
						for.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<div>{form.formState.errors.root?.message}</div>
					<form
						// eslint-disable-next-line
						onSubmit={form.handleSubmit(async (values) => {
							await createKey(values.validUntil);
							await revalidator.revalidate();
							setOpen(false);
						})}
					>
						<FormField
							control={form.control}
							name="validUntil"
							render={({ field }) => (
								<FormItem className="space-x-2">
									<FormLabel>Valid for</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.values(ValidForPeriod).map(
												(period) => (
													<SelectItem
														value={period}
														key={period}
													>
														{period}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting && <Loader />}
								Create key
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export default function ApiKeys({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<NewKeyDialog />
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>API key</TableHead>
						<TableHead>creation</TableHead>
						<TableHead>valid until</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loaderData.keys.map((key) => (
						<TableRow key={key.apiKeyId}>
							<TableCell className="font-mono">
								{key.key}
							</TableCell>
							<TableCell>
								{new Date(key.created).toLocaleString()}
							</TableCell>
							<TableCell>
								{key.validUntil
									? new Date(key.validUntil).toLocaleString()
									: '-'}
							</TableCell>
							<TableCell>
								{key.validUntil &&
								new Date(key.validUntil) < new Date() ? (
									<span>invalid</span>
								) : (
									<InvalidateDialog apiKey={key} />
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}
