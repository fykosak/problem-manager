export default function howTo() {
	const pages = import.meta.glob('../../docs/*.md');
	return (
		<div className="max-w-screen-sm mx-auto mb-8">
			{Object.keys(pages).map((page) => (
				<p>{page.split('/').pop()}</p>
			))}
		</div>
	);
}
