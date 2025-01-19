export async function clientLoader() {
	await new Promise(r => setTimeout(r, 2000));
}

export default function Index() {
	return <h1>Edit úlohy</h1>
}
