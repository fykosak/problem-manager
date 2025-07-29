import { TRPCClientError } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { trpc } from '@client/trpc';

import { Button } from '../ui/button';
import { Form } from '../ui/form';
import { Loader } from '../ui/loader';

export function ImportOrganizersForm() {
	const form = useForm();

	const { formState } = form;

	async function onSubmit() {
		try {
			await trpc.organizers.import.mutate();
			toast.success('Organizátoři importovaní');
		} catch (exception) {
			if (exception instanceof TRPCClientError) {
				toast.error('Error při importu organizátorů', {
					description: exception.message,
				});
			}
		}
	}

	return (
		<Form {...form}>
			<form
				// eslint-disable-next-line
				onSubmit={form.handleSubmit(async () => {
					await onSubmit();
				})}
			>
				<Button type="submit" disabled={formState.isSubmitting}>
					{formState.isSubmitting && <Loader />} Importovat
					organizátory
				</Button>
			</form>
		</Form>
	);
}
