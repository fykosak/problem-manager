import { lintGutter, linter } from '@codemirror/lint';
import { EditorView, keymap } from '@codemirror/view';
import { material } from '@uiw/codemirror-theme-material';
import CodeMirror from '@uiw/react-codemirror';
import { latex, latexLinter } from 'lang-latex';
import { ForwardedRef, forwardRef, useEffect, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { config } from '@client/config';
import { useEditorLayout } from '@client/hooks/editorLayoutProvider';

import { Loader } from '../ui/loader';

const palette = [
	'#e25963',
	'#8ec16a',
	'#e6ba67',
	'#4ba7f3',
	'#c265de',
	'#47b5c2',
];

const Editor = forwardRef(
	({ textId }: { textId: number }, ref: ForwardedRef<HTMLDivElement>) => {
		const auth = useAuth();

		// state values
		const [ready, setReady] = useState(false);
		const [connectionStatus, setConnectionStatus] = useState('connecting');

		// Yjs object refs
		const ydocRef = useRef<Y.Doc | null>(null);
		const providerRef = useRef<WebsocketProvider | null>(null);
		const yTextRef = useRef<Y.Text | null>(null);
		const undoManagerRef = useRef<Y.UndoManager | null>(null);

		const { buildFunctions } = useEditorLayout();

		useEffect(() => {
			// create Yjs objects
			const ydoc = new Y.Doc();
			const yText = ydoc.getText();
			const provider = new WebsocketProvider(
				config.WS_URL,
				textId.toString(),
				ydoc,
				{
					params: {
						auth: auth.user
							? 'Bearer ' + auth.user.access_token
							: '',
					},
					resyncInterval: 3000,
				}
			);

			// store them in refs
			ydocRef.current = ydoc;
			providerRef.current = provider;
			yTextRef.current = yText;

			// tract connection status
			provider.on('status', ({ status }) => setConnectionStatus(status));

			const handleSync = (synced: boolean) => {
				if (!synced) {
					return;
				}
				undoManagerRef.current = new Y.UndoManager(yText);

				// bind awareness info
				const color =
					palette[Math.floor(Math.random() * palette.length)];
				const awarenessUser = {
					name: auth.user?.profile.name ?? '',
					color: color,
				};
				provider.awareness.setLocalStateField('user', awarenessUser);

				// Ensure user mapping
				const userData = new Y.PermanentUserData(ydoc);
				userData.setUserMapping(
					ydoc,
					ydoc.clientID,
					awarenessUser.name
				);

				setReady(true);
			};
			provider.once('sync', handleSync);

			return () => {
				provider.off('sync', handleSync);
				provider.destroy();
				ydoc.destroy();
				ydocRef.current = null;
				providerRef.current = null;
				yTextRef.current = null;
				undoManagerRef.current = null;
				setReady(false);
			};
		}, []);

		if (
			!ready ||
			!yTextRef.current ||
			!providerRef.current ||
			!undoManagerRef.current
		) {
			return (
				<div
					ref={ref}
					className="flex flex-col justify-center items-center text-muted-foreground m-2"
				>
					<span className="inline-flex gap-1">
						<Loader />
						{connectionStatus === 'connected'
							? 'Načítání editoru...'
							: 'Připojování...'}
					</span>
				</div>
			);
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
					value={yTextRef.current.toJSON()}
					height="100%"
					//width="600px"
					theme={material}
					style={{
						fontSize: '14px',
					}}
					className="grow h-px"
					spellCheck={true}
					extensions={[
						latex(),
						linter(latexLinter),
						lintGutter(),
						yCollab(
							yTextRef.current,
							providerRef.current.awareness,
							{
								undoManager: undoManagerRef.current,
							}
						),
						EditorView.lineWrapping,
						keymap.of([
							{
								key: 'Ctrl-s',
								mac: 'Cmd-s',
								run: () => {
									const buildFunction =
										buildFunctions.get(textId);
									if (buildFunction) {
										buildFunction().catch(() => {});
									}
									return true;
								},
							},
						]),
					]}
					basicSetup={{ foldGutter: true, dropCursor: true }}
				/>
			</div>
		);
	}
);

export default Editor;
