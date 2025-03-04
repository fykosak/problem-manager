import {
	Column,
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';
import { DataTablePagination } from './dataTablePagination';
import * as React from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@client/components/ui/select';
import { ArrowDownUp, Filter } from 'lucide-react';
import { Button } from './button';

// Button to select a filter option to uniquely filter in a given column
export function DataTableColumnUniqueFilter<TData, TValue>({
	column,
}: {
	column: Column<TData, TValue>;
}) {
	const possibleValues = column.getFacetedUniqueValues();
	const ALL_VALUES = '__all__';

	const options = [
		<SelectItem key={ALL_VALUES} value={ALL_VALUES}>
			Vše
		</SelectItem>,
	];
	for (const [key] of possibleValues) {
		options.push(
			// eslint-disable-next-line
			<SelectItem key={key} value={`${key}`}>
				{key}
			</SelectItem>
		);
	}

	return (
		<Select
			onValueChange={(value) => {
				if (value == ALL_VALUES) {
					column.setFilterValue(undefined);
				} else {
					column.setFilterValue(value);
				}
			}}
		>
			<SelectTrigger variant="ghost" size="icon" arrow={false}>
				<Filter />
			</SelectTrigger>
			<SelectContent side="bottom">{options}</SelectContent>
		</Select>
	);
}

// Button that triggers column sorting
export function DataTableColumnSorter<TData, TValue>({
	column,
}: {
	column: Column<TData, TValue>;
}) {
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
		>
			<ArrowDownUp />
		</Button>
	);
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [pagination, setPagination] = React.useState<PaginationState>({
		pageSize: 20,
		pageIndex: 0,
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onPaginationChange: setPagination,
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: (table, columnId) => () => {
			// Custom implementation of unique values to account for array values
			const uniqueValueMap = new Map<unknown, number>();

			const facetedRowModel = table
				.getColumn(columnId)
				?.getFacetedRowModel();

			if (!facetedRowModel) {
				return new Map();
			}

			for (const row of facetedRowModel.flatRows) {
				for (const columnValue of row.getUniqueValues(columnId)) {
					if (Array.isArray(columnValue)) {
						for (const value of columnValue) {
							const prevCount = uniqueValueMap.get(value) || 0;
							uniqueValueMap.set(value, prevCount + 1);
						}
					} else {
						const prevCount = uniqueValueMap.get(columnValue) || 0;
						uniqueValueMap.set(columnValue, prevCount + 1);
					}
				}
			}

			return uniqueValueMap;
		},
		state: {
			sorting,
			columnFilters,
			pagination,
		},
	});

	return (
		<div>
			<div className="rounded-md border my-2">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext()
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && 'selected'
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
