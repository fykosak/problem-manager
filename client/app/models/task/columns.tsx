import {
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from '@radix-ui/react-dialog';
import { ColumnDef } from '@tanstack/react-table';
import { TRPCClientError } from '@trpc/client';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@client/components/ui/button';
import {
	DataTableColumnSorter,
	DataTableColumnUniqueFilter,
} from '@client/components/ui/dataTable';
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@client/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@client/components/ui/dropdown-menu';
import { trpc, trpcOutputTypes } from '@client/trpc';

export interface Task {
	problemId: number;
	name: string | null;
	authors: string[];
	problemTopics: string[];
	type: string;
	state: string;
	created: Date;
}

async function assignProblemToSeries(seriesId: number, problemId: number) {
	try {
		await trpc.problem.assignSeries.mutate({
			problemId,
			seriesId,
		});
		toast.success('Problem assigned to series');
	} catch (error) {
		if (error instanceof TRPCClientError) {
			toast.error('Failed to assign problem', {
				description: error.message,
			});
		}
	}
}

function RowActions({
	series,
	problem,
}: {
	series: trpcOutputTypes['series']['list'];
	problem: Task;
}) {
	const [open, setOpen] = useState(false);
	const revalidator = useRevalidator();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost">
						<MoreHorizontal />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuItem>
						<NavLink to={'../task/' + problem.problemId}>
							Otevřit úlohu
						</NavLink>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<DialogTrigger>Vybrat do série</DialogTrigger>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select series</DialogTitle>
					<DialogDescription>
						Select series to assign the task to
					</DialogDescription>
				</DialogHeader>
				<div className="grid grid-cols-3 gap-4 items-center">
					{series.map((series) => (
						<Button
							key={series.seriesId}
							variant="outline"
							// eslint-disable-next-line
							onClick={async () => {
								await assignProblemToSeries(
									series.seriesId,
									problem.problemId
								);
								setOpen(false);
								await revalidator.revalidate();
							}}
						>
							{series.label}
						</Button>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function getColumns(series: trpcOutputTypes['series']['list']) {
	const columns: ColumnDef<Task>[] = [
		{
			accessorKey: 'name',
			header: 'Název',
			cell: ({ row }) => {
				const problemId: number = row.original.problemId;
				const name: string = row.getValue('name');
				return <NavLink to={'../task/' + problemId}>{name}</NavLink>;
			},
		},
		{
			accessorKey: 'authors',
			header: ({ column }) => {
				return (
					<div className="flex flex-nowrap items-center">
						Autor
						<DataTableColumnUniqueFilter column={column} />
						<DataTableColumnSorter column={column} />
					</div>
				);
			},
			filterFn: 'arrIncludes',
		},
		{
			accessorKey: 'problemTopics',
			header: ({ column }) => {
				return (
					<div className="flex flex-nowrap items-center">
						Téma
						<DataTableColumnUniqueFilter column={column} />
						<DataTableColumnSorter column={column} />
					</div>
				);
			},
			filterFn: 'arrIncludes',
		},
		{
			accessorKey: 'type',
			header: ({ column }) => {
				return (
					<div className="flex flex-nowrap items-center">
						Typ
						<DataTableColumnUniqueFilter column={column} />
					</div>
				);
			},
			filterFn: 'equalsString',
		},
		{
			accessorKey: 'state',
			header: ({ column }) => {
				return (
					<div className="flex flex-nowrap items-center">
						Stav
						<DataTableColumnUniqueFilter column={column} />
					</div>
				);
			},
			filterFn: 'equalsString',
		},
		{
			accessorKey: 'created',
			cell: ({ row }) => {
				const created: Date = row.getValue('created');
				return created.toLocaleString('cs-CZ', {
					day: '2-digit',
					month: '2-digit',
					year: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
				});
			},
			header: ({ column }) => {
				return (
					<div className="flex flex-nowrap items-center">
						Vytvořeno
						<DataTableColumnSorter column={column} />
					</div>
				);
			},
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				return <RowActions series={series} problem={row.original} />;
			},
		},
	];
	return columns;
}
