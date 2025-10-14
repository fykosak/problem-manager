import { TRPCClientError } from '@trpc/client';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@client/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@client/components/ui/tooltip';
import { trpc } from '@client/trpc';

export function DownloadButton({
	filename,
	problemId,
}: {
	filename: string;
	problemId: number;
}) {
	async function downloadFile() {
		try {
			const datauri = await trpc.problem.files.download.query({
				problemId,
				filename,
			});
			const linkElement = window.document.createElement('a');
			linkElement.href = datauri;
			linkElement.setAttribute('download', filename);
			window.document.body.appendChild(linkElement);
			linkElement.click();
			window.document.body.removeChild(linkElement);
		} catch (error) {
			if (error instanceof TRPCClientError) {
				toast.error(`Chyba při stahování souboru ${filename}`, {
					description: error.message,
				});
			}
		}
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						// eslint-disable-next-line
						onClick={downloadFile}
					>
						<Download />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Stáhnout soubor</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
