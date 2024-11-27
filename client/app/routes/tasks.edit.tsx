import React from 'react';
import CodeMirror from '@uiw/react-codemirror/src/index.js';
import { material } from '@uiw/codemirror-theme-material';
import { latex } from '~/libs/lang-latex/dist';

export default function TaskEdit() {
	const [value, setValue] = React.useState(`
\\command{} \\command{arg} \\command[asdf]{asdw} % comment
$\\frac{a}{b}$
\\begin{env}
env content
\\end{env}
test $math$ test $123 \\%$ not a comment
`);
	return <CodeMirror value={value} height="1200px" width="1000px" theme={material} extensions={[latex()]} basicSetup={
		{ foldGutter: true }
	} />;
}
