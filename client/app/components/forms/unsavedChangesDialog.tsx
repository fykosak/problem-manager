import { useMemo } from 'react';
import { useBlocker } from 'react-router';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
} from '../ui/alert-dialog';

export function UnsavedChangesDialog({ isDirty }: { isDirty: boolean }) {
	const blocker = useBlocker(useMemo(() => isDirty, [isDirty]));

	return (
		<AlertDialog open={blocker.state === 'blocked'}>
			<AlertDialogContent>
				<AlertDialogHeader>Neuloženy změny</AlertDialogHeader>
				<AlertDialogDescription>
					Chcete opravdu opustit stránku bez uložení?
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => {
							blocker.reset?.();
						}}
					>
						Vrátit se na stránku
					</AlertDialogCancel>
					<AlertDialogAction
						variant={'destructive'}
						onClick={() => {
							blocker.proceed?.();
						}}
					>
						Pokračovat
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
