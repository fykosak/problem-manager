import { ColumnDef } from "@tanstack/react-table"
import { ArrowDownUp, Filter } from "lucide-react"
import { Button } from "~/components/ui/button"
import { DataTableUniqueFilter } from "~/components/ui/dataTable"

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
			return <div className="flex flex-nowrap gap-1 items-center">
				Téma
				<DataTableUniqueFilter column={column} />
			</div>;
		},
		filterFn: "arrIncludes"
	},
	{
		accessorKey: "type",
		header: ({ column }) => {
			return <div className="flex flex-nowrap gap-1 items-center">
				Typ
				<DataTableUniqueFilter column={column} />
			</div>;
		},
		filterFn: "equalsString"
	},
	{
		accessorKey: "state",
		header: ({ column }) => {
			return <div className="flex flex-nowrap gap-1 items-center">
				Stav
				<DataTableUniqueFilter column={column} />
			</div>;
		},
		filterFn: "equalsString"
	},
	{
		accessorKey: "created",
		cell: ({ row }) => {
			const created: Date = row.getValue("created")
			return created.toLocaleString("cs-CZ")
		},
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Vytvořeno
					<ArrowDownUp className="ml-2 h-4 w-4" />
				</Button>
			)
		},
	},
]
