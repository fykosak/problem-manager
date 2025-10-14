import { zodResolver } from '@hookform/resolvers/zod';
import { TRPCClientError } from '@trpc/client';
import { useForm } from 'react-hook-form';
import { useRevalidator } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@client/components/ui/badge';
import { Button } from '@client/components/ui/button';
import { Form } from '@client/components/ui/form';
import { Loader } from '@client/components/ui/loader';
import { trpc, trpcOutputTypes } from '@client/trpc';

const formSchema = z.object({});

export function WebTextItem({
	text,
}: {
	text: trpcOutputTypes['problem']['texts'][0];
}) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	const revalidator = useRevalidator();

	async function handleRelease() {
		try {
			await trpc.text.release.mutate({
				textId: text.textId,
			});
			toast.success('Text zveřejněn');
			await revalidator.revalidate();
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error('HTML textu se nepovedlo vygenerovat', {
					description: error.message,
				});
			}
		}
	}

	async function handleRevoke() {
		try {
			await trpc.text.revoke.mutate({
				textId: text.textId,
			});
			toast.success('Text odveřejněn');
			await revalidator.revalidate();
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(error.message);
			}
		}
	}

	return (
		<Form {...form}>
			<div className="rounded-xl border border-2 p-2 flex justify-between items-center">
				<span>
					{text.type} - {text.lang}
					{text.html ? (
						<Badge variant="success" className="ms-2">
							Zveřejněno
						</Badge>
					) : (
						<Badge variant="destructive" className="ms-2">
							Nezveřejněno
						</Badge>
					)}
				</span>
				<span className="space-x-2">
					{/*eslint-disable-next-line*/}
					<Button onClick={form.handleSubmit(handleRelease)}>
						{form.formState.isSubmitting && <Loader />}{' '}
						{text.html ? (
							<>Zveřejnit aktuální verzi</>
						) : (
							<>Zveřejnit</>
						)}
					</Button>
					{text.html && (
						<Button
							variant="destructive"
							// eslint-disable-next-line
							onClick={form.handleSubmit(handleRevoke)}
						>
							{form.formState.isSubmitting && <Loader />}
							Odveřejnit
						</Button>
					)}
				</span>
			</div>
		</Form>
	);
}
