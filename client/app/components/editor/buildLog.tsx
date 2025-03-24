import LatexParser from '@client/lib/latexLogParser';
import { cn } from '@client/lib/utils';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '../ui/card';

function BuildLogError({
	level,
	file,
	line,
	message,
}: {
	level: string;
	file: string;
	line: number | null;
	message: string;
}) {
	let cardStyle = '';
	if (level === 'typesetting') {
		cardStyle = 'border-l-blue-500';
	}
	if (level === 'warning') {
		cardStyle = 'border-l-yellow-500';
	}
	if (level === 'error') {
		cardStyle = 'border-l-red-500';
	}

	return (
		<Card className={cn('m-5 overflow-hidden border-l-4', cardStyle)}>
			<CardHeader>
				<CardTitle>{level}</CardTitle>
				<CardDescription>
					{line && <>Line {line}, </>}
					{file && <>File {file}</>}
				</CardDescription>
			</CardHeader>
			<CardContent>{message}</CardContent>
		</Card>
	);
}

export function BuildLog({ log }: { log: string }) {
	if (!log) {
		return 'No log';
	}
	const parsedLog = new LatexParser(log).parse();

	return (
		<div className="flex flex-col grow h-px ">
			<div className="overflow-y-scroll">
				{parsedLog.all.map((line) => (
					<BuildLogError
						level={line.level}
						file={line.file}
						line={line.line}
						message={line.message}
					/>
				))}
			</div>
		</div>
	);
}
