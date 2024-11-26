import { useEffect } from 'react'
import './App.css'
import { trpc } from './trpc'
import Editor from './Editor.tsx'

function App() {
	// TODO for testing
	const fetchUser = async () => {
		const user = await trpc.getUser.query('2');
		console.log(user);
	}

	useEffect(() => {
		fetchUser();
	}, []);

	return (
		<>
			<Editor />
		</>
	)
}

export default App
