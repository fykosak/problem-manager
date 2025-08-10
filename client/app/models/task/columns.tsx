import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router';

import { problemStateEnum } from '@server/db/schema';

import { Button } from '@client/components/ui/button';
import {
	DataTableColumnSorter,
	DataTableColumnUniqueFilter,
} from '@client/components/ui/dataTable';
import { Dialog, DialogTrigger } from '@client/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@client/components/ui/dropdown-menu';
import { trpcOutputTypes } from '@client/trpc';

import { ChangeContestComponent } from './changeContestComponent';
import { ChangeStateComponent } from './changeStateComponent';
import { SelectSeriesComponent } from './selectSeriesComponent';

export interface Task {
	problemId: number;
	name: string | null;
	authors: string[];
	problemTopics: string[];
	type: string;
	state: (typeof problemStateEnum.enumValues)[number];
	created: Date;
	contestSymbol: string;
}

function RowActions({
	series,
	problem,
	contests: contests,
}: {
	series: trpcOutputTypes['series']['list'];
	problem: Task;
	contests: trpcOutputTypes['getContests'];
}) {
	const [open, setOpen] = useState(false);

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
					<ChangeStateComponent problem={problem} setOpen={setOpen} />
					{problem.state === 'active' && (
						<DropdownMenuItem>
							<DialogTrigger>Vybrat do série</DialogTrigger>
						</DropdownMenuItem>
					)}
					{problem.state === 'active' && (
						<ChangeContestComponent
							problem={problem}
							contests={contests}
							setOpen={setOpen}
						/>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			<SelectSeriesComponent
				series={series}
				problem={problem}
				setOpen={setOpen}
			/>
		</Dialog>
	);
}

export function getColumns(
	series: trpcOutputTypes['series']['list'],
	contests: trpcOutputTypes['getContests']
) {
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
				return (
					<RowActions
						series={series}
						problem={row.original}
						contests={contests}
					/>
				);
			},
		},
	];
	return columns;
}
