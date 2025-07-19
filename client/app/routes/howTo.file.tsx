//export async function clientLoader({ params }: Route.ClientLoaderArgs) {
//	const texts = await trpc.problem.texts.query({
//		problemId: Number(params.taskId),
//	});
//	return { texts };
//}
//
import fs from 'fs/promises';
import path from 'node:path';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGFM from 'remark-gfm';

import { Route } from './+types/howTo.file';

export async function loader({ params }: Route.LoaderArgs) {
	const filepath = path.join('./docs/', params.markdownFile + '.md');
	const content = await fs.readFile(filepath, { encoding: 'utf8' });
	return { markdown: content };
}

export default function howToFile({ loaderData }: Route.ComponentProps) {
	return (
		<div className="max-w-screen-sm mx-auto mb-8">
			<Markdown
				remarkPlugins={[remarkGFM]}
				rehypePlugins={[rehypeRaw]}
				components={{
					a(props) {
						const { node, ...rest } = props;
						return (
							<a
								className="text-blue-600 dark:text-blue-500 hover:underline"
								{...rest}
							/>
						);
					},
					p(props) {
						const { node, ...rest } = props;
						return <p className="my-4" {...rest} />;
					},
					ul(props) {
						const { node, ...rest } = props;
						return (
							<ul
								className="list-disc list-outside pl-5"
								{...rest}
							/>
						);
					},
				}}
			>
				{loaderData.markdown}
			</Markdown>
		</div>
	);
}
