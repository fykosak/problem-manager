import { lintGutter, linter } from '@codemirror/lint';
import { material } from '@uiw/codemirror-theme-material';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { latex, latexLinter } from 'lang-latex';
import { CircleCheckIcon } from 'lucide-react';
import { ForwardedRef, forwardRef, useEffect, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { toast } from 'sonner';
import { yCollab } from 'y-codemirror.next';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import { Loader } from '../ui/loader';

const Editor = forwardRef(
	({ textId }: { textId: number }, ref: ForwardedRef<HTMLDivElement>) => {
		const auth = useAuth();
		const ydocRef = useRef(new Y.Doc());
		const providerRef = useRef<WebsocketProvider | null>(null);
		const yTextRef = useRef(ydocRef.current.getText());
		const undoManagerRef = useRef(new Y.UndoManager(yTextRef.current));

		const [connectionStatus, setConnectionStatus] =
			useState('disconnected');
		const [syncStatus, setSyncStatus] = useState(false);

		// Set user awareness on mount
		useEffect(() => {
			const ydoc = ydocRef.current;
			const provider = new WebsocketProvider(
				'ws://localhost:8081',
				textId.toString(),
				ydoc
			);
			providerRef.current = provider;

			provider.on('status', ({ status }) => setConnectionStatus(status));
			provider.on('sync', (sync) => setSyncStatus(sync));

			const awarenessUser = {
				name: auth.user?.profile.name ?? '',
				color: '#553322',
				colorLight: '#998866',
			};
			provider.awareness.setLocalStateField('user', awarenessUser);

			// Ensure user mapping
			const userData = new Y.PermanentUserData(ydoc);
			userData.setUserMapping(ydoc, ydoc.clientID, awarenessUser.name);

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

		if (connectionStatus === 'disconnected') {
			return (
				<div ref={ref} className="h-full flex flex-col">
					<Loader /> Odpojeno
				</div>
			);
		}

		if (connectionStatus == 'connecting') {
			return (
				<div ref={ref} className="h-full flex flex-col">
					<Loader /> Připojování
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
				<div className="inline-flex gap-2 text-sm">
					{syncStatus ? (
						<>
							<CircleCheckIcon className="text-green-500" />{' '}
							Uloženo
						</>
					) : (
						<>
							<Loader /> Synchronizace
						</>
					)}
				</div>
				<CodeMirror
					value={yTextRef.current.toJSON()}
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
						yCollab(
							yTextRef.current,
							providerRef.current.awareness,
							{
								undoManager: undoManagerRef.current,
							}
						),
						EditorView.lineWrapping,
					]}
					basicSetup={{ foldGutter: true }}
				/>
			</div>
		);
	}
);

export default Editor;
