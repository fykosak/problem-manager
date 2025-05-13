/**
 * LatexParser class for parsing the TeX output log and returning it as an array
 * of messages.
 *
 * The code is a typescript modification of the original javascript code from
 * the Overleaf project. Original code can be found here:
 * https://github.com/overleaf/overleaf/blob/ed9844b2ec79c7f1bbc45c4a47897967bf1a9e52/services/web/frontend/js/ide/log-parser/latex-log-parser.js
 */

// Define some constants
const LOG_WRAP_LIMIT = 79;
const LATEX_WARNING_REGEX = /^LaTeX(?:3| Font)? Warning: (.*)$/;
const HBOX_WARNING_REGEX = /^(Over|Under)full \\(v|h)box/;
const PACKAGE_WARNING_REGEX = /^((?:Package|Class|Module) \b.+\b Warning:.*)$/;
// This is used to parse the line number from common latex warnings
const LINES_REGEX = /lines? ([0-9]+)/;
// This is used to parse the package name from the package warnings
const PACKAGE_REGEX = /^(?:Package|Class|Module) (\b.+\b) Warning/;
const FILE_LINE_ERROR_REGEX = /^([./].*):(\d+): (.*)/;

enum State {
	NORMAL = 0,
	ERROR = 1,
}

type Error = {
	line: number | null;
	file: string;
	level: 'error' | 'warning' | 'typesetting';
	message: string;
	content?: string;
	raw: string;
};

export default class LatexParser {
	state: State = State.NORMAL;
	ignoreDuplicates: boolean;

	openParens: number = 0;
	latexWarningRegex: RegExp = LATEX_WARNING_REGEX;
	packageWarningRegex: RegExp = PACKAGE_WARNING_REGEX;
	packageRegex: RegExp = PACKAGE_REGEX;
	log: LogText;

	currentLine: string | false = false;
	currentFilePath: string = '';
	currentFileList: string[] = [];

	rootFileList: string[] = [];
	fileStack: {
		path: string;
		files: string[];
	}[] = [];

	currentError: Error = {
		line: null,
		file: '',
		level: 'typesetting',
		message: '',
		raw: '',
	};
	data: Error[] = [];

	constructor(
		text: string,
		options: {
			ignoreDuplicates?: boolean;
		} = {}
	) {
		this.ignoreDuplicates = options.ignoreDuplicates ?? false;
		this.log = new LogText(text);
	}

	public parse() {
		while ((this.currentLine = this.log.nextLine()) !== false) {
			if (this.state === State.NORMAL) {
				if (this.currentLineIsError()) {
					this.state = State.ERROR;
					this.currentError = {
						line: null,
						file: this.currentFilePath,
						level: 'error',
						message: this.currentLine.slice(2),
						content: '',
						raw: this.currentLine + '\n',
					};
				} else if (this.currentLineIsFileLineError()) {
					this.state = State.ERROR;
					this.parseFileLineError();
				} else if (this.currentLineIsRunawayArgument()) {
					this.parseRunawayArgumentError();
				} else if (this.currentLineIsWarning()) {
					this.parseSingleWarningLine(this.latexWarningRegex);
				} else if (this.currentLineIsHboxWarning()) {
					this.parseHboxLine();
				} else if (this.currentLineIsPackageWarning()) {
					this.parseMultipleWarningLine();
				} else {
					this.parseParensForFilenames();
				}
			}
			if (this.state === State.ERROR) {
				this.currentError.content += this.log
					.linesUpToNextMatchingLine(/^l\.[0-9]+/)
					.join('\n');
				this.currentError.content += '\n';
				this.currentError.content += this.log
					.linesUpToNextWhitespaceLine(true)
					.join('\n');
				this.currentError.content += '\n';
				this.currentError.content += this.log
					.linesUpToNextWhitespaceLine(true)
					.join('\n');
				this.currentError.raw += this.currentError.content;
				const lineNo = this.currentError.raw.match(/l\.([0-9]+)/);
				if (lineNo && this.currentError.line === null) {
					this.currentError.line = parseInt(lineNo[1], 10);
				}
				this.data.push(this.currentError);
				this.state = State.NORMAL;
			}
		}
		return this.postProcess(this.data);
	}

	private currentLineIsError() {
		if (this.currentLine === false) {
			return false;
		}
		return (
			this.currentLine[0] === '!' &&
			this.currentLine !==
				'!  ==> Fatal error occurred, no output PDF file produced!'
		);
	}

	private currentLineIsFileLineError() {
		if (this.currentLine === false) {
			return false;
		}
		return FILE_LINE_ERROR_REGEX.test(this.currentLine);
	}

	private currentLineIsRunawayArgument() {
		if (this.currentLine === false) {
			return false;
		}
		return !!this.currentLine.match(/^Runaway argument/);
	}

	private currentLineIsWarning() {
		if (this.currentLine === false) {
			return false;
		}
		return !!this.currentLine.match(this.latexWarningRegex);
	}

	private currentLineIsPackageWarning() {
		if (this.currentLine === false) {
			return false;
		}
		return !!this.currentLine.match(this.packageWarningRegex);
	}

	private currentLineIsHboxWarning() {
		if (this.currentLine === false) {
			return false;
		}
		return !!this.currentLine.match(HBOX_WARNING_REGEX);
	}

	private parseFileLineError() {
		if (this.currentLine === false) {
			return;
		}
		const result = this.currentLine.match(FILE_LINE_ERROR_REGEX);
		if (!result) {
			return false;
		}
		this.currentError = {
			line: parseInt(result[2]),
			file: result[1],
			level: 'error',
			message: result[3],
			content: '',
			raw: this.currentLine + '\n',
		};
	}

	private parseRunawayArgumentError() {
		this.currentError = {
			line: null,
			file: this.currentFilePath,
			level: 'error',
			message: this.currentLine !== false ? this.currentLine : '',
			content: '',
			raw: this.currentLine !== false ? this.currentLine + '\n' : '',
		};
		this.currentError.content += this.log
			.linesUpToNextWhitespaceLine()
			.join('\n');
		this.currentError.content += '\n';
		this.currentError.content += this.log
			.linesUpToNextWhitespaceLine()
			.join('\n');
		this.currentError.raw += this.currentError.content;
		const lineNo = this.currentError.raw.match(/l\.([0-9]+)/);
		if (lineNo) {
			this.currentError.line = parseInt(lineNo[1], 10);
		}
		return this.data.push(this.currentError);
	}

	private parseSingleWarningLine(prefixRegex: RegExp) {
		if (this.currentLine === false) {
			return;
		}
		const warningMatch = this.currentLine.match(prefixRegex);
		if (!warningMatch) {
			return;
		}
		const warning = warningMatch[1];
		const lineMatch = warning.match(LINES_REGEX);
		const line = lineMatch ? parseInt(lineMatch[1], 10) : null;
		this.data.push({
			line,
			file: this.currentFilePath,
			level: 'warning',
			message: warning,
			raw: warning,
		});
	}

	private parseMultipleWarningLine() {
		if (this.currentLine === false) {
			return;
		}
		// Some package warnings are multiple lines, let's parse the first line
		let warningMatch = this.currentLine.match(this.packageWarningRegex);
		// Something strange happened, return early
		if (!warningMatch) {
			return;
		}
		const warningLines = [warningMatch[1]];
		let lineMatch = this.currentLine.match(LINES_REGEX);
		let line = lineMatch ? parseInt(lineMatch[1], 10) : null;
		const packageMatch = this.currentLine.match(this.packageRegex);
		if (!packageMatch) {
			return;
		}
		const packageName = packageMatch[1];
		// Regex to get rid of the unnecesary (packagename) prefix in most multi-line warnings
		const prefixRegex = new RegExp(
			'(?:\\(' + packageName + '\\))*[\\s]*(.*)',
			'i'
		);
		// After every warning message there's a blank line, let's use it
		while ((this.currentLine = this.log.nextLine())) {
			lineMatch = this.currentLine.match(LINES_REGEX);
			line = lineMatch ? parseInt(lineMatch[1], 10) : line;
			warningMatch = this.currentLine.match(prefixRegex);
			if (!warningMatch) {
				continue;
			}
			warningLines.push(warningMatch[1]);
		}
		const rawMessage = warningLines.join(' ');
		this.data.push({
			line,
			file: this.currentFilePath,
			level: 'warning',
			message: rawMessage,
			raw: rawMessage,
		});
	}

	private parseHboxLine() {
		if (this.currentLine === false) {
			return;
		}
		const lineMatch = this.currentLine.match(LINES_REGEX);
		const line = lineMatch ? parseInt(lineMatch[1], 10) : null;
		this.data.push({
			line,
			file: this.currentFilePath,
			level: 'typesetting',
			message: this.currentLine,
			raw: this.currentLine,
		});
	}

	// Check if we're entering or leaving a new file in this line
	private parseParensForFilenames() {
		if (this.currentLine === false) {
			return;
		}
		const pos = this.currentLine.search(/[()]/);
		if (pos !== -1) {
			const token = this.currentLine[pos];
			this.currentLine = this.currentLine.slice(pos + 1);
			if (token === '(') {
				const filePath = this.consumeFilePath();
				if (filePath) {
					this.currentFilePath = filePath;
					const newFile = {
						path: filePath,
						files: [] as string[],
					};
					this.fileStack.push(newFile);
					//this.currentFileList.push(newFile);
					this.currentFileList = newFile.files;
				} else {
					this.openParens++;
				}
			} else if (token === ')') {
				if (this.openParens > 0) {
					this.openParens--;
				} else {
					if (this.fileStack.length > 1) {
						this.fileStack.pop();
						const previousFile =
							this.fileStack[this.fileStack.length - 1];
						this.currentFilePath = previousFile.path;
						this.currentFileList = previousFile.files;
					}
				}
			}
			// else {
			//		 Something has gone wrong but all we can do now is ignore it :(
			// }
			// Process the rest of the line
			this.parseParensForFilenames();
		}
	}

	private consumeFilePath() {
		// Our heuristic for detecting file names are rather crude

		if (this.currentLine === false) {
			return;
		}

		// To contain a file path this line must have at least one / before any '(', ')' or '\'
		if (!this.currentLine.match(/^\/?([^ ()\\]+\/)+/)) {
			return false;
		}

		// A file may not contain a '(', ')' or '\'
		let endOfFilePath = this.currentLine.search(/[ ()\\]/);

		// handle the case where there is a space in a filename
		while (
			endOfFilePath !== -1 &&
			this.currentLine[endOfFilePath] === ' '
		) {
			const partialPath = this.currentLine.slice(0, endOfFilePath);
			// consider the file matching done if the space is preceded by a file extension (e.g. ".tex")
			if (/\.\w+$/.test(partialPath)) {
				break;
			}
			// advance to next space or ) or end of line
			const remainingPath = this.currentLine.slice(endOfFilePath + 1);
			// consider file matching done if current path is followed by any of "()[]
			if (/^\s*["()[\]]/.test(remainingPath)) {
				break;
			}
			const nextEndOfPath = remainingPath.search(/[ "()[\]]/);
			if (nextEndOfPath === -1) {
				endOfFilePath = -1;
			} else {
				endOfFilePath += nextEndOfPath + 1;
			}
		}
		let path;
		if (endOfFilePath === -1) {
			path = this.currentLine;
			this.currentLine = '';
		} else {
			path = this.currentLine.slice(0, endOfFilePath);
			this.currentLine = this.currentLine.slice(endOfFilePath);
		}
		return path;
	}

	private postProcess(data: Error[]) {
		const all: Error[] = [];
		const errorsByLevel = {
			error: [] as Error[],
			warning: [] as Error[],
			typesetting: [] as Error[],
		};
		const hashes = new Set();

		const hashEntry = (entry: Error) => entry.raw;

		data.forEach((item) => {
			const hash = hashEntry(item);

			if (this.ignoreDuplicates && hashes.has(hash)) {
				return;
			}

			errorsByLevel[item.level]?.push(item);

			all.push(item);
			hashes.add(hash);
		});

		return {
			errors: errorsByLevel.error,
			warnings: errorsByLevel.warning,
			typesetting: errorsByLevel.typesetting,
			all,
			files: this.rootFileList,
		};
	}
}

class LogText {
	text: string;
	lines: string[];
	row: number;

	constructor(text: string) {
		this.text = text.replace(/(\r\n)|\r/g, '\n');
		// Join any lines which look like they have wrapped.
		const wrappedLines = this.text.split('\n');
		this.lines = [wrappedLines[0]];

		for (let i = 1; i < wrappedLines.length; i++) {
			// If the previous line is as long as the wrap limit then
			// append this line to it.
			// Some lines end with ... when LaTeX knows it's hit the limit
			// These shouldn't be wrapped.
			// If the next line looks like it could be an error (i.e. start with a !),
			// do not unwrap the line.
			const prevLine = wrappedLines[i - 1];
			const currentLine = wrappedLines[i];

			if (
				prevLine.length === LOG_WRAP_LIMIT &&
				prevLine.slice(-3) !== '...' &&
				currentLine.charAt(0) !== '!'
			) {
				this.lines[this.lines.length - 1] += currentLine;
			} else {
				this.lines.push(currentLine);
			}
		}
		this.row = 0;
	}

	nextLine() {
		this.row++;
		if (this.row >= this.lines.length) {
			return false;
		} else {
			return this.lines[this.row];
		}
	}

	rewindLine() {
		this.row--;
	}

	linesUpToNextWhitespaceLine(stopAtError: boolean = false) {
		return this.linesUpToNextMatchingLine(/^ *$/, stopAtError);
	}

	linesUpToNextMatchingLine(match: RegExp, stopAtError: boolean = false) {
		const lines = [];

		while (true) {
			const nextLine = this.nextLine();

			if (nextLine === false) {
				break;
			}

			if (stopAtError && nextLine.match(/^! /)) {
				this.rewindLine();
				break;
			}

			lines.push(nextLine);

			if (nextLine.match(match)) {
				break;
			}
		}

		return lines;
	}
}
