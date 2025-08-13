import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@client/components/ui/form';
import { Input } from '@client/components/ui/input';
import { Loader } from '@client/components/ui/loader';
import { trpc, type trpcOutputTypes } from '@client/trpc';

import PersonSelect from './tasks/personSelect';
import { Checkbox } from './ui/checkbox';
import { FieldSetContent, FieldSetRoot, FieldSetTitle } from './ui/fielset';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

const formSchema = z.object({
	metadata: z.object({
		name: z.object({
			cs: z.string().optional(),
			en: z.string().optional(),
		}),
		origin: z.object({
			cs: z.string().optional(),
			en: z.string().optional(),
		}),
		points: z.coerce.number().int().min(0, 'Points must be positive'),
		result: z.object({
			value: z.coerce.number().optional(),
			unit: z.string().optional(),
			precision: z.coerce.number().min(0, 'Precision should be positive'),
			expectedPlaces: z.coerce
				.number()
				.int('Expected places must be a whole number')
				.min(1, 'Should expect at least one place'),
		}),
	}),
	authors: z.object({
		task: z.number().array(),
		solution: z.number().array(),
	}),
	topics: z.number().array().min(1),
	type: z.coerce.number(),
});

export function MetadataForm({
	problemId,
	taskData,
	availableTopics,
	availableTypes,
	organizers,
}: {
	problemId: number;
	taskData: trpcOutputTypes['problem']['metadata'];
	availableTopics: trpcOutputTypes['contest']['availableTopics'];
	availableTypes: trpcOutputTypes['contest']['availableTypes'];
	organizers: trpcOutputTypes['contest']['organizers'];
}) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			metadata: {
				name: {
					cs: '',
					en: '',
				},
				origin: {
					cs: '',
					en: '',
				},
				points: 0,
				result: {
					value: undefined,
					unit: undefined,
					precision: undefined,
					expectedPlaces: undefined,
				},
				...taskData.metadata, // overrites with already saved values
			},
			authors: taskData.authors,
			topics: taskData.topics,
			type: taskData.type,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		await trpc.problem.updateMetadata.mutate({
			...values,
			problemId: problemId,
		});
		toast.success('Task data saved');
	}

	function getAvailableTopicsCheckboxComponents() {
		return availableTopics.map((item) => (
			<FormField
				key={item.topicId}
				control={form.control}
				name="topics"
				render={({ field }) => (
					<FormItem
						key={item.topicId}
						className="flex flex-row items-start space-x-3 space-y-0"
					>
						<FormControl>
							<Checkbox
								checked={field.value?.includes(item.topicId)}
								onCheckedChange={(checked) => {
									return checked
										? field.onChange([
												...field.value,
												item.topicId,
											])
										: field.onChange(
												field.value?.filter(
													(value) =>
														value !== item.topicId
												)
											);
								}}
							/>
						</FormControl>
						<FormLabel className="text-sm font-normal">
							{item.label}
						</FormLabel>
					</FormItem>
				)}
			/>
		));
	}

	function getAuthorField(
		fieldName: 'authors.task' | 'authors.solution',
		label: string
	) {
		return (
			<FormField
				control={form.control}
				name={fieldName}
				render={({ field }) => (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<PersonSelect
							organizers={organizers}
							selected={field.value}
							onChange={(personId, selected) => {
								if (selected) {
									field.onChange([...field.value, personId]);
								} else {
									field.onChange(
										field.value.filter(
											(value) => value != personId
										)
									);
								}
							}}
						/>
						<FormMessage />
					</FormItem>
				)}
			/>
		);
	}

	const { formState } = form;
	const { errors } = formState;

	return (
		<Form {...form}>
			<div>{errors.root?.message}</div>
			<form
				// eslint-disable-next-line
				onSubmit={form.handleSubmit(async (values) => {
					try {
						await onSubmit(values);
					} catch (exception) {
						form.setError('root', {
							message: (exception as Error).message ?? 'Error',
							type: 'server',
						});
					}
				})}
				className="space-y-8"
			>
				<FormField
					control={form.control}
					name="metadata.name.cs"
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
					name="metadata.name.en"
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
					name="metadata.origin.cs"
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
					name="metadata.origin.en"
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
					name="metadata.points"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Body</FormLabel>
							<FormControl>
								<Input
									type="number"
									placeholder="body"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FieldSetRoot>
					<FieldSetTitle>Výsledek úlohy</FieldSetTitle>
					<FieldSetContent>
						<FormField
							control={form.control}
							name="metadata.result.value"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Číselný výsledek</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="např. 1.1e-2"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="metadata.result.unit"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Jednotky</FormLabel>
									<FormControl>
										<Input
											placeholder="např. m.s^{-1}"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="metadata.result.precision"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tolerance</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="např. 0.1"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="metadata.result.expectedPlaces"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Očekávaný počet platných cifer
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="např. 2"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FieldSetContent>
				</FieldSetRoot>

				{getAuthorField('authors.task', 'Autoři zadání')}
				{getAuthorField('authors.solution', 'Autoři řešení')}

				<FormField
					control={form.control}
					name="topics"
					render={() => (
						<FormItem>
							<FormLabel>Témata</FormLabel>
							<div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
								{getAvailableTopicsCheckboxComponents()}
							</div>
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
									{availableTypes.map((type) => (
										<FormItem
											className="flex items-center space-x-3 space-y-0"
											key={type.typeId}
										>
											<FormControl>
												<RadioGroupItem
													value={type.typeId.toString()}
												/>
											</FormControl>
											<FormLabel className="font-normal">
												{type.label}
											</FormLabel>
										</FormItem>
									))}
								</RadioGroup>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={formState.isSubmitting}>
					{formState.isSubmitting && <Loader />}Uložit
				</Button>
			</form>
		</Form>
	);
}
