import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/components/ui/button';
import {
	FieldSetContent,
	FieldSetRoot,
	FieldSetTitle,
} from '@client/components/ui/fieldset';
import { Form } from '@client/components/ui/form';
import { Loader } from '@client/components/ui/loader';
import { trpc, type trpcOutputTypes } from '@client/trpc';

import { AuthorSelection } from './authorSelection';
import { FormInput } from './formInput';
import { TopicSelection } from './topicSelection';
import { TypeSelection } from './typeSelection';

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
			precision: z.coerce
				.number()
				.min(0, 'Precision should be positive')
				.optional(),
			expectedPlaces: z.coerce
				.number()
				.int('Expected places must be a whole number')
				.min(1, 'Should expect at least one place')
				.optional(),
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
	topics,
	availableTypes,
	organizers,
	metadataFields,
}: {
	problemId: number;
	taskData: trpcOutputTypes['problem']['metadata'];
	topics: trpcOutputTypes['contest']['topics'];
	availableTypes: trpcOutputTypes['contest']['availableTypes'];
	organizers: trpcOutputTypes['contest']['organizers'];
	metadataFields: trpcOutputTypes['contest']['metadataFields'];
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
				{metadataFields.includes('name') && (
					<FieldSetRoot>
						<FieldSetTitle>Název úlohy</FieldSetTitle>
						<FieldSetContent>
							<FormInput
								control={form.control}
								name="metadata.name.cs"
								placeholder="Český název"
								label="Název CS"
							/>

							<FormInput
								control={form.control}
								name="metadata.name.en"
								placeholder="Anglický název"
								label="Název EN"
							/>
						</FieldSetContent>
					</FieldSetRoot>
				)}

				{metadataFields.includes('origin') && (
					<FieldSetRoot>
						<FieldSetTitle>Původ úlohy</FieldSetTitle>
						<FieldSetContent>
							<FormInput
								control={form.control}
								name="metadata.origin.cs"
								placeholder="Český původ"
								label="Původ CS"
							/>
							<FormInput
								control={form.control}
								name="metadata.origin.en"
								placeholder="Anglický původ"
								label="Původ EN"
							/>
						</FieldSetContent>
					</FieldSetRoot>
				)}

				{metadataFields.includes('points') && (
					<FormInput
						control={form.control}
						name="metadata.points"
						placeholder="Počet bodů"
						label="Body za úlohu"
						type="number"
					/>
				)}

				{metadataFields.includes('result') && (
					<FieldSetRoot>
						<FieldSetTitle>Výsledek úlohy</FieldSetTitle>
						<FieldSetContent>
							<FormInput
								control={form.control}
								name="metadata.result.value"
								placeholder="např. 1.1e-2"
								label="Číselný výsledek"
								type="number"
							/>

							<FormInput
								control={form.control}
								name="metadata.result.unit"
								placeholder="např. m.s^{-1}"
								label="Jednotky"
							/>

							<FormInput
								control={form.control}
								name="metadata.result.precision"
								placeholder="např. 0.1"
								label="Tolerance"
								type="number"
							/>

							<FormInput
								control={form.control}
								name="metadata.result.expectedPlaces"
								placeholder="např. 2"
								label="number"
							/>
						</FieldSetContent>
					</FieldSetRoot>
				)}

				<AuthorSelection
					control={form.control}
					name="authors.task"
					label="Authoři zadání"
					organizers={organizers}
				/>

				<AuthorSelection
					control={form.control}
					name="authors.solution"
					label="Authoři řešení"
					organizers={organizers}
				/>

				<TopicSelection
					control={form.control}
					name="topics"
					topics={topics}
					checkedTopics={new Set(taskData.topics)}
				/>

				<TypeSelection
					control={form.control}
					name="type"
					availableTypes={availableTypes}
				/>

				<Button type="submit" disabled={formState.isSubmitting}>
					{formState.isSubmitting && <Loader />}Uložit
				</Button>
			</form>
		</Form>
	);
}
