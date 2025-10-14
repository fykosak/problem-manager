import { AlertDialogDescription } from '@radix-ui/react-alert-dialog';
import { TRPCClientError } from '@trpc/client';
import { Trash } from 'lucide-react';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';

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
import { buttonVariants } from '@client/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@client/components/ui/tooltip';
import { trpc } from '@client/trpc';

export function DeleteFileButton({
	file,
	problemId,
}: {
	file: string;
	problemId: number;
}) {
	const revalidator = useRevalidator();

	async function deleteFile(filename: string) {
		try {
			await trpc.problem.files.delete.mutate({ problemId, filename });
			toast.success(`Soubor ${filename} smazán`);
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(`Chyba při mazání souboru ${filename}`, {
					description: error.message,
				});
			}
		} finally {
			await revalidator.revalidate();
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
