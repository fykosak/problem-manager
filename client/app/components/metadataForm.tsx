import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "~/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Checkbox } from "./ui/checkbox"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

const formSchema = z.object({
	name: z.object({
		cs: z.string().optional(),
		en: z.string().optional()
	}),
	origin: z.object({
		cs: z.string().optional(),
		en: z.string().optional()
	}),
	points: z.coerce.number().int().min(0, "Points must be positive"),
	topics: z.number().array(),
	type: z.coerce.number().nullable()
});

const topics = [
	{
		id: 1,
		label: "Kinematika",
	},
	{
		id: 2,
		label: "Dynamika",
	},
	{
		id: 3,
		label: "Astro",
	},
];

const types = [
	{
		id: 1,
		label: "Jednoduchá"
	},
	{
		id: 2,
		label: "Složitá"
	},
	{
		id: 3,
		label: "Experimentální"
	}
]

export function MetadataForm() {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: {
				cs: "",
				en: ""
			},
			origin: {
				cs: "",
				en: ""
			},
			points: 0,
			topics: [],
			type: null
		},
	})

	function onSubmit(values: z.infer<typeof formSchema>) {
		console.log(values)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<FormField
					control={form.control}
					name="name.cs"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Název cs</FormLabel>
							<FormControl>
								<Input placeholder="Název" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="name.en"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Název en</FormLabel>
							<FormControl>
								<Input placeholder="Name" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="origin.cs"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Původ cs</FormLabel>
							<FormControl>
								<Input placeholder="Původ" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="origin.en"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Původ en</FormLabel>
							<FormControl>
								<Input placeholder="Origin" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="points"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Body</FormLabel>
							<FormControl>
								<Input type="number" placeholder="body" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="topics"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Témata</FormLabel>
							{topics.map((item) => (
								<FormField
									key={item.id}
									control={form.control}
									name="topics"
									render={({ field }) => (
										<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value?.includes(item.id)}
													onCheckedChange={(checked) => {
														return checked
															? field.onChange([...field.value, item.id])
															: field.onChange(
																field.value?.filter(
																	(value: any) => value !== item.id
																)
															)
													}}
												/>
											</FormControl>
											<FormLabel className="text-sm font-normal">
												{item.label}
											</FormLabel>
										</FormItem>
									)}
								/>
							))}
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="type"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Typ úlohy</FormLabel>
							<FormControl>
								<RadioGroup
									onValueChange={field.onChange}
									defaultValue={field.value?.toString()}
								>
									{types.map((type) => (
										<FormItem className="flex items-center space-x-3 space-y-0" key={type.id}>
											<FormControl>
												<RadioGroupItem value={type.id.toString()} />
											</FormControl>
											<FormLabel className="font-normal">
												{type.label}
											</FormLabel>
										</FormItem>))}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">Submit</Button>
			</form>
		</Form >
	)
}
