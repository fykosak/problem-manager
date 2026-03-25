import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGFM from 'remark-gfm';

export function MarkdownText({ children }: { children?: string }) {
	return (
		<Markdown
			remarkPlugins={[remarkGFM]}
			rehypePlugins={[rehypeRaw]}
			components={{
				a: (props) => {
					const { node, href, ...rest } = props; // eslint-disable-line

					// Remove .md suffix from relative paths so that URL
					// paths are without extentions but extension can be
					// used for working links on github.
					let transformedHref = href;
					if (href) {
						const match = href.match(/^(\.\/.*)\.md/);
						if (match && match.length >= 2) {
							transformedHref = match[1];
						}
					}

					return (
						<a
							className="text-blue-600 dark:text-blue-500 hover:underline"
							href={transformedHref}
							{...rest}
						/>
					);
				},
				p: (props) => {
					const { node, ...rest } = props; // eslint-disable-line
					return <p className="mb-4 text-justify" {...rest} />;
				},
				ul: (props) => {
					const { node, ...rest } = props; // eslint-disable-line
					return (
						<ul
							className="list-disc list-outside pl-5 mb-4"
							{...rest}
						/>
					);
				},
				ol: (props) => {
					const { node, ...rest } = props; // eslint-disable-line
					return (
						<ul
							className="list-decimal list-outside pl-5 mb-4"
							{...rest}
						/>
					);
				},
				code: (props) => {
					const { node, ...rest } = props; // eslint-disable-line
					return (
						<code
							className="bg-muted rounded-md p-1 text-sm"
							{...rest}
						/>
					);
				},
			}}
		>
			{children}
		</Markdown>
	);
}
