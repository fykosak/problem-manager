import { ColumnDef } from "@tanstack/react-table"
import { ArrowDownUp } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DataTableColumnSorter, DataTableColumnUniqueFilter } from "~/components/ui/dataTable"

export type Task = {
	name: string
	author: string
	topic: string[]
	type: string
	state: string
	created: Date
}

export const columns: ColumnDef<Task>[] = [
	{
		accessorKey: "name",
		header: "Název"
	},
	{
		accessorKey: "author",
		header: "Autor"
	},
	{
		accessorKey: "topic",
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
