import {
	Column,
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table"
import { DataTablePagination } from "./dataTablePagination"
import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger } from "~/components/ui/select";
import { Filter } from "lucide-react";

export function DataTableUniqueFilter<TData, TValue>({ column }: { column: Column<TData, TValue> }) {
	const possibleValues = column.getFacetedUniqueValues();
	const ALL_VALUES = '__all__';

	let options = [
		<SelectItem key={ALL_VALUES} value={ALL_VALUES}>Vše</SelectItem>
	];
	for (let [key, _] of possibleValues) {
		options.push(
			<SelectItem key={key} value={`${key}`}>{key}</SelectItem >
		);
	}

	return <Select
		onValueChange={(value) => {
			if (value == ALL_VALUES) {
				column.setFilterValue(undefined);
			} else {
				column.setFilterValue(value);
			}
		}}>
		<SelectTrigger className="h-8 w-[70px]">
			<Filter />
		</SelectTrigger>
		<SelectContent side="bottom">
			{options}
		</SelectContent>
	</Select>;
}

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
}

export function DataTable<TData, TValue>({
	columns,
	data,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: (table, columnId) => () => {
			// Custom implementation of unique values to account for array values
			const uniqueValueMap = new Map<any, number>();

			const facetedRowModel = table.getColumn(columnId)?.getFacetedRowModel();

			if (!facetedRowModel) {
				return new Map();
			}

			for (let row of facetedRowModel.flatRows) {
				for (let columnValue of row.getUniqueValues(columnId)) {
					if (Array.isArray(columnValue)) {
						for (let value of columnValue) {
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
		}
	});

	return (
		<div>
			<div className="rounded-md border">
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
													header.column.columnDef.header,
													header.getContext()
												)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination table={table} />
		</div>
	)
}
