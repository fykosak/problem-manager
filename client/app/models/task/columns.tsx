import { ColumnDef } from "@tanstack/react-table"
import { NavLink } from "react-router"
import { DataTableColumnSorter, DataTableColumnUniqueFilter } from "~/components/ui/dataTable"

export type Task = {
	problemId: number
	name: string | null
	authors: string[]
	problemTopics: string[]
	type: string
	state: string
	created: Date
}

export const columns: ColumnDef<Task>[] = [
	{
		accessorKey: "name",
		header: "Název",
		cell: ({ row }) => {
			const problemId: number = row.original.problemId;
			const name: string = row.getValue("name");
			return <NavLink to={'../task/' + problemId}>{name}</NavLink >
		},
	},
	{
		accessorKey: "authors",
		header: ({ column }) => {
			return <div className="flex flex-nowrap items-center">
				Autor
				<DataTableColumnUniqueFilter column={column} />
				<DataTableColumnSorter column={column} />
			</div>;
		},
		filterFn: "arrIncludes"
	},
	{
		accessorKey: "problemTopics",
		header: ({ column }) => {
			return <div className="flex flex-nowrap items-center">
				Téma
				<DataTableColumnUniqueFilter column={column} />
				<DataTableColumnSorter column={column} />
			</div>;
		},
		filterFn: "arrIncludes"
	},
	{
		accessorKey: "type",
		header: ({ column }) => {
			return <div className="flex flex-nowrap items-center">
				Typ
				<DataTableColumnUniqueFilter column={column} />
			</div>;
		},
		filterFn: "equalsString"
	},
	{
		accessorKey: "state",
		header: ({ column }) => {
			return <div className="flex flex-nowrap items-center">
				Stav
				<DataTableColumnUniqueFilter column={column} />
			</div>;
		},
		filterFn: "equalsString"
	},
	{
		accessorKey: "created",
		cell: ({ row }) => {
			const created: Date = row.getValue("created")
			return created.toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
		},
		header: ({ column }) => {
			return <div className="flex flex-nowrap items-center">
				Vytvořeno
				<DataTableColumnSorter column={column} />
			</div>;
		},
	},
]
