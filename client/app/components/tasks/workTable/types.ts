import { trpcOutputTypes } from '@client/trpc';

export type SeriesList = trpcOutputTypes['series']['list'];
export type Series = SeriesList[number];
export type Problem = Series['problems'][number];
export type Work = Problem['work'][number];
export type WorkConfig = NonNullable<
	trpcOutputTypes['contest']['availableWork']
>;
export type WorkGroupConfig = {
	groupName: string | null;
	items: { name: string; optional: boolean }[];
};
export type MetadataField =
	trpcOutputTypes['contest']['metadataFields'][number];
export type WorkRow = {
	problem: Problem;
	works: Work[];
};
