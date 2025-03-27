import { zodResolver } from '@hookform/resolvers/zod';
import { AlertDialogDescription } from '@radix-ui/react-alert-dialog';
import { TRPCClientError } from '@trpc/client';
import { Pen, Trash } from 'lucide-react';
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
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@client/components/ui/alert-dialog';
import { Button, buttonVariants } from '@client/components/ui/button';
import { Form, FormField, FormItem } from '@client/components/ui/form';
import { Input } from '@client/components/ui/input';
import { Loader } from '@client/components/ui/loader';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@client/components/ui/tooltip';
import { trpc } from '@client/trpc';

function DeleteFileButton({
	file,
	problemId,
}: {
	file: string;
	problemId: number;
}) {
	const revalidator = useRevalidator();

	async function deleteFile(filename: string) {
		console.log('delete');
		try {
			await trpc.problem.files.delete.mutate({ problemId, filename });
			await revalidator.revalidate();
			toast.success(`File ${filename} deleted`);
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(`Error occured while deleting file ${filename}`, {
					description: error.message,
				});
			}
		}
	}

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
						<TooltipContent>Delete</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete file</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete the file {file}?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						// eslint-disable-next-line
						onClick={async () => await deleteFile(file)}
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

const formSchema = z.object({
	filename: z.string(),
});

export function FileListItem({
	filename,
	problemId,
}: {
	filename: string;
	problemId: number;
}) {
	const [isEditting, setIsEditting] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			filename: filename,
		},
	});

	const filenameField = !isEditting ? (
		filename
	) : (
		<FormField
			control={form.control}
			name="filename"
			render={({ field }) => (
				<FormItem>
					<Input type="text" {...field} />
				</FormItem>
			)}
		/>
	);

	const revalidator = useRevalidator();

	async function handleSubmit(values: z.infer<typeof formSchema>) {
		if (filename === values.filename) {
			return;
		}
		try {
			await trpc.problem.files.rename.mutate({
				problemId: problemId,
				oldName: filename,
				newName: values.filename,
			});
			toast.success('File renamed');
			setIsEditting(false);
			await revalidator.revalidate();
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(error.message);
			}
		}
	}

	return (
		<Form {...form}>
			<div className="rounded-xl border border-2 p-2 flex justify-between items-center">
				{/* eslint-disable-next-line */}
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					{filenameField}
				</form>
				<span className="space-x-2">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									// eslint-disable-next-line
									onClick={async () => {
										if (isEditting) {
											console.log('handle submit');
											// handleSubmit returns a function that needs to be called
											await form.handleSubmit(
												handleSubmit
											)();
										}
										setIsEditting(!isEditting);
										form.reset();
									}}
									disabled={form.formState.isSubmitting}
								>
									{form.formState.isSubmitting ? (
										<Loader />
									) : (
										<Pen />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>Rename</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<DeleteFileButton problemId={problemId} file={filename} />
				</span>
			</div>
		</Form>
	);
}
