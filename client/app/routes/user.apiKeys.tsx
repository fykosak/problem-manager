import { AlertDialogDescription } from '@radix-ui/react-alert-dialog';
import { TooltipContent, TooltipProvider } from '@radix-ui/react-tooltip';
import { TRPCError } from '@trpc/server';
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
import { Button, buttonVariants } from '@client/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';
import { Tooltip, TooltipTrigger } from '@client/components/ui/tooltip';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Route } from './+types/user.apiKeys';

export async function clientLoader() {
	const keys = await trpc.person.apiKey.list.query();
	return { keys };
}

async function createKey() {
	try {
		await trpc.person.apiKey.create.mutate();
		toast.success('Key created');
	} catch (error) {
		if (error instanceof TRPCError) {
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
		if (error instanceof TRPCError) {
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

export default function ApiKeys({ loaderData }: Route.ComponentProps) {
	const revalidator = useRevalidator();
	return (
		<>
			<Button
				// eslint-disable-next-line
				onClick={async () => {
					await createKey();
					await revalidator.revalidate();
				}}
			>
				Generate new key
			</Button>
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
								<InvalidateDialog apiKey={key} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}
