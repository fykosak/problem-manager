import { Link } from 'react-router';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@client/components/ui/table';

import { getProblemName } from './helpers';
import { MetadataField, Problem, Series } from './types';

export function getMetadataLabel(field: MetadataField) {
	switch (field) {
		case 'name':
			return 'Název';
		case 'origin':
			return 'Původ';
		case 'points':
			return 'Body';
		case 'result':
			return 'Výsledek';
	}
}

function getScalarValue(value: unknown) {
	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
		? String(value)
		: '';
}

export function getMetadataValue(problem: Problem, field: MetadataField) {
	const value = problem.metadata[field];

	if (field === 'name' || field === 'origin') {
		if (value && typeof value === 'object' && 'cs' in value) {
			return getScalarValue(value.cs);
		}
		return '';
	}

	if (field === 'result') {
		if (!value || typeof value !== 'object') {
			return '';
		}
		if (!('value' in value) || !('unit' in value)) {
			return '';
		}
		return [getScalarValue(value.value), getScalarValue(value.unit)]
			.filter(Boolean)
			.join(' ');
	}

	return getScalarValue(value);
}

export function MetadataTable({
	series,
	fields,
}: {
	series: Series;
	fields: MetadataField[];
}) {
	if (fields.length === 0) return null;
	return (
		<div className="mt-8">
			<h2 className="mb-2">Metadata úloh</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Úloha</TableHead>
						{fields.map((field) => (
							<TableHead key={field}>
								{getMetadataLabel(field)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{series.problems.map((problem) => (
						<TableRow key={problem.problemId}>
							<TableCell>
								<Link
									to={`../task/${problem.problemId}`}
									className="hover:underline"
								>
									{problem.seriesOrder}.{' '}
									{getProblemName(problem.metadata)}
								</Link>
							</TableCell>
							{fields.map((field) => (
								<TableCell key={field}>
									{getMetadataValue(problem, field)}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
