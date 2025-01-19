import { useEffect } from 'react';
import * as Y from 'yjs';
// @ts-ignore
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';

import CodeMirror from '@uiw/react-codemirror/src/index.js';
import { material } from '@uiw/codemirror-theme-material';
import { latex, latexLinter } from '~/libs/lang-latex/dist/index.js';
import { linter, lintGutter } from '@codemirror/lint';

export default function Editor() {
	const ydoc = new Y.Doc();
	const provider = new WebsocketProvider('ws://localhost:8081', 'my-roomname', ydoc);
	const yText = ydoc.getText('codemirror');
	const undoManager = new Y.UndoManager(yText);

	useEffect(() => {
		return (() => {
			if (!provider.wsconnected) {
				return;
			}
			provider.destroy();
			ydoc.destroy();
		});
	}, []);

	provider.awareness.setLocalStateField('user', {
		name: 'Anonymous ' + Math.floor(Math.random() * 100),
		color: '#553322',
		colorLight: '#998866'
	});

	return <CodeMirror value={yText.toString()}
		height="1200px"
		width="1000px"
		theme={material}
		style={{
			fontSize: "16px"
		}}
		extensions={[
			latex(),
			linter(latexLinter),
			lintGutter(),
			yCollab(yText, provider.awareness, { undoManager })
		]}
		basicSetup={
			{ foldGutter: true }
		}
	/>;
}
