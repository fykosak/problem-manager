import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
// @ts-ignore
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';

import CodeMirror, { EditorView } from '@uiw/react-codemirror/src/index.js';
import { material } from '@uiw/codemirror-theme-material';
import { latex, latexLinter } from '~/libs/lang-latex/dist/index.js';
import { linter, lintGutter } from '@codemirror/lint';

export default function Editor({ textId }: { textId: number }) {
	const ydocRef = useRef(new Y.Doc());
	const providerRef = useRef(
		new WebsocketProvider(
			'ws://localhost:8081',
			textId.toString(),
			ydocRef.current,
			{ connect: false }
		)
	);
	const yTextRef = useRef(ydocRef.current.getText());
	const undoManagerRef = useRef(new Y.UndoManager(yTextRef.current));

	const [connected, setConnected] = useState(false);

	// Set user awareness on mount
	useEffect(() => {
		console.log('runnning useEffect');
		const ydoc = ydocRef.current;
		const provider = new WebsocketProvider(
			'ws://localhost:8081',
			textId.toString(),
			ydoc,
			{ connect: false }
		);
		providerRef.current = provider;

		provider.connect();
		setConnected(true);

		const user = {
			name: 'Anonymous ' + Math.floor(Math.random() * 100),
			color: '#553322',
			colorLight: '#998866',
		};
		provider.awareness.setLocalStateField('user', user);

		// Ensure user mapping
		const userData = new Y.PermanentUserData(ydoc);
		userData.setUserMapping(ydoc, ydoc.clientID, user.name);

		return () => {
			console.log('provider destroy');
			provider.destroy();
			ydoc.destroy();
		};
	}, []);

	// Ensure yText is defined before rendering
	if (!yTextRef.current) {
		return null;
	}
	if (!providerRef.current) {
		return null;
	}
	if (!undoManagerRef.current) {
		return null;
	}

	return (
		<CodeMirror
			value={yTextRef.current.toString()}
			height="800px"
			width="600px"
			theme={material}
			style={{
				fontSize: '16px',
			}}
			extensions={[
				latex(),
				linter(latexLinter),
				lintGutter(),
				yCollab(yTextRef.current, providerRef.current.awareness, {
					undoManager: undoManagerRef.current,
				}),
				EditorView.lineWrapping,
			]}
			basicSetup={{ foldGutter: true }}
		/>
	);
}
