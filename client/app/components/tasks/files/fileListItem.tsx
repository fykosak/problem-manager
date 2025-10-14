import { zodResolver } from '@hookform/resolvers/zod';
import { TRPCClientError } from '@trpc/client';
import { Pen } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/components/ui/button';
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

import { DeleteFileButton } from './deleteFileButton';
import { DownloadButton } from './downloadButton';

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
			toast.success(`Soubor přejmenován na ${values.filename}`);
			setIsEditting(false);
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(error.message);
			}
		} finally {
			await revalidator.revalidate();
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
					<DownloadButton problemId={problemId} filename={filename} />
					<DeleteFileButton problemId={problemId} file={filename} />
				</span>
			</div>
		</Form>
	);
}
