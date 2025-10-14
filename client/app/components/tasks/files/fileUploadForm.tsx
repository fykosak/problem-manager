import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@client/components/ui/button';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@client/components/ui/form';
import { Input } from '@client/components/ui/input';
import { Loader } from '@client/components/ui/loader';
import { trpc } from '@client/trpc';

const formSchema = z.object({
	files: z.instanceof(globalThis.FileList, { message: 'No file selected' }),
	//.refine((file) => file.size < 5 * 1024 * 1024, {
	//	message: 'File must be smaller than 5MB.',
	//}),
});

function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			// extract base64 data from url encoded string
			const dataPart = (reader.result as string).split(',', 2)[1];
			resolve(dataPart);
		};
		reader.onerror = () => reject(reader.error as Error);
	});
}

export function FileUploadForm({ problemId }: { problemId: number }) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	const revalidator = useRevalidator();

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const files = [];
		for (const file of values.files) {
			files.push({
				name: file.name,
				data: await fileToBase64(file),
			});
		}

		await trpc.problem.files.upload.mutate({
			problemId: problemId,
			files: files,
		});
	}

	return (
		<Form {...form}>
			<div>{form.formState.errors.root?.message}</div>
			<form
				className="space-y-2"
				// eslint-disable-next-line
				onSubmit={form.handleSubmit(async (values) => {
					try {
						await onSubmit(values);
						toast.success('Soubor nahrán');
						form.reset();
						if (fileInputRef.current) {
							fileInputRef.current.value = '';
						}
					} catch (exception) {
						form.setError('root', {
							message: (exception as Error).message ?? 'Error',
							type: 'server',
						});
						toast.error('Chyba během nahrávání souboru', {
							description: (exception as Error).message,
						});
					} finally {
						await revalidator.revalidate();
					}
				})}
			>
				<FormField
					control={form.control}
					name="files"
					render={({
						// exlude value and ref from input props
						// eslint-disable-next-line
						field: { value, onChange, ref, ...fieldProps },
					}) => (
						<FormItem>
							<FormLabel>Soubor</FormLabel>
							<Input
								ref={fileInputRef}
								type="file"
								{...fieldProps}
								name="files"
								onChange={(event) =>
									onChange(event.target.files)
								}
								multiple
							/>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting && <Loader />}
					Nahrát soubor
				</Button>
			</form>
		</Form>
	);
}
