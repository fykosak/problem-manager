import {
	Column,
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	Row,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { ArrowDownUp, Filter } from 'lucide-react';
import * as React from 'react';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@client/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';

import { Button } from './button';
import { DataTablePagination } from './dataTablePagination';

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

	const filterValue = column.getFilterValue();

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
			<SelectTrigger
				variant={filterValue ? 'default' : 'ghost'}
				size="icon"
				arrow={false}
				className="m-1"
			>
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
	getOnRowClick?: (
		row: Row<TData>
	) => React.MouseEventHandler<HTMLTableRowElement>;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	getOnRowClick,
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
		autoResetPageIndex: false,
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
		<div className="my-5">
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
									onClick={(event) => {
										if (!getOnRowClick) {
											return;
										}
										// Check if we are clicking inside the
										// row or cell and not inside the dialog.
										const targetElement =
											event.target as HTMLElement;
										if (
											targetElement.tagName !== 'TD' &&
											targetElement.tagName !== 'TR'
										) {
											return;
										}
										const handler = getOnRowClick(row);
										handler(event);
									}}
									className={
										getOnRowClick && 'cursor-pointer'
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
