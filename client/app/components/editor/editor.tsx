import { forwardRef, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
// @ts-ignore
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';

import CodeMirror, { EditorView } from '@uiw/react-codemirror/src/index.js';
import { material } from '@uiw/codemirror-theme-material';
import { latex, latexLinter } from '~/libs/lang-latex/dist/index.js';
import { linter, lintGutter } from '@codemirror/lint';

const Editor = forwardRef(({ textId }: { textId: number }, ref) => {
	const ydocRef = useRef(new Y.Doc());
	const providerRef = useRef<WebsocketProvider | null>(null);
	const yTextRef = useRef(ydocRef.current.getText());
	const undoManagerRef = useRef(new Y.UndoManager(yTextRef.current));

	const [connected, setConnected] = useState(false);

	// Set user awareness on mount
	useEffect(() => {
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

	/* CSS trick:
	 * The container is a flex col with only the CodeMirror as a child with the
	 * ability to grow. This means that the editor will be the size of the
	 * parent. But this also fixes an issue of when the editor is larger then
	 * the container, the container (and all containers it's inside of) expands,
	 * which creates new 100% height that is larger than the original container
	 * meant to take up certain space.
	 * This way the editor is only 1 px tall, so the container does not have
	 * a reason to expand when thanks to the flex and grow, the editor is
	 * expanded as if it was height: 100%.
	 */
	return (
		<div ref={ref} className="h-full flex flex-col">
			<CodeMirror
				value={yTextRef.current.toString()}
				height="100%"
				//width="600px"
				theme={material}
				style={{
					fontSize: '14px',
				}}
				className="grow h-px"
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
		</div>
	);
});

export default Editor;
