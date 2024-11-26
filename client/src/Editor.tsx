import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { javascript } from '@codemirror/lang-javascript';

function Editor() {
	const [value, setValue] = React.useState("console.log('hello world!');");
	const onChange = React.useCallback((val, viewUpdate) => {
		console.log('val:', val);
		setValue(val);
	}, []);
	return <CodeMirror value={value} height="1200px" width="1000px" theme={atomone} onChange={onChange} spellCheck="true" extensions={[javascript({ jsx: true })]} />;
}
export default Editor;
