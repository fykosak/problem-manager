export function isEscaped(textBefore: string) {
	let backslashes = 0;
	for (let pos = textBefore.length - 1; pos >= 0; pos--) {
		if (textBefore[pos] !== '\\') break;
		backslashes++;
	}
	return backslashes % 2 === 1;
}
