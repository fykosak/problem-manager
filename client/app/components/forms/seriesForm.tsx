import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@client/components/ui/form';
import { trpc, trpcOutputTypes } from '@client/trpc';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader } from '../ui/loader';

// Input datetime-local needs a iso format, but without the timezone,
// otherwise it's unable to display the value. When using .toISOString()
// and cutting the timezone info, it's in UTC instead of browser timezone,
// which is confusing. So the date needs to be formatted manually.
function formatDateTimeForInput(date: Date): string {
	const pad = (num: number) => num.toString().padStart(2, '0');
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1); // Months are 0-based
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());

	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const formSchema = z.object({
	label: z.string().min(1, 'Label cannot be empty'),
	release: z.coerce.date().optional(),
	deadline: z.coerce.date().optional(),
});

export function SeriesForm({
	contestSymbol,
	contestYear,
	series,
}: {
	contestSymbol: string;
	contestYear: number;
	series?: trpcOutputTypes['series']['get'];
}) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			label: series?.label ?? '',
			release: series?.release ? new Date(series.release) : undefined,
			deadline: series?.deadline ? new Date(series.deadline) : undefined,
		},
	});

	const { formState } = form;
	const { errors } = formState;

	const navigate = useNavigate();
	async function onSubmit(values: z.infer<typeof formSchema>) {
		if (series) {
			await trpc.series.edit.mutate({
				seriesId: series.seriesId,
				...values,
			});
			await navigate('..');
		} else {
			await trpc.series.create.mutate({
				contestSymbol,
				contestYear,
				...values,
			});
			await navigate('..');
		}
	}

	return (
		<Form {...form}>
			<div>{errors.root?.message}</div>
			<form
				className="space-y-8"
				// eslint-disable-next-line
				onSubmit={form.handleSubmit(async (values) => {
					try {
						await onSubmit(values);
						if (series) {
							toast.success('Series saved');
						} else {
							toast.success('Series created');
						}
					} catch (exception) {
						form.setError('root', {
							message: (exception as Error).message ?? 'Error',
							type: 'server',
						});
						toast.error('Failed to create series');
					}
				})}
			>
				<FormField
					control={form.control}
					name="label"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Označení série</FormLabel>
							<Input {...field} />
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="release"
					render={({ field: { value, onChange, ...fieldProps } }) => (
						<FormItem>
							<FormLabel>Termín zveřejnění</FormLabel>
							<Input
								type="datetime-local"
								value={
									value ? formatDateTimeForInput(value) : ''
								}
								onChange={(element) =>
									onChange(new Date(element.target.value))
								}
								{...fieldProps}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="deadline"
					render={({ field: { value, onChange, ...fieldProps } }) => (
						<FormItem>
							<FormLabel>Termín deadlinu</FormLabel>
							<Input
								type="datetime-local"
								value={
									value ? formatDateTimeForInput(value) : ''
								}
								onChange={(element) =>
									onChange(new Date(element.target.value))
								}
								{...fieldProps}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit" disabled={formState.isSubmitting}>
					{formState.isSubmitting && <Loader />}
					{!series ? <>Vytvořit</> : <>Uložit</>}
				</Button>
			</form>
		</Form>
	);
}
