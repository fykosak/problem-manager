import { type Input } from '@lezer/common';

/**
 * Basic input for a lang-latex parser storing the input as a simple string.
 */
export class ParserInput implements Input {
	private text: string;
	public readonly length: number;
	public readonly lineChunks: boolean = false;
	constructor(text: string) {
		this.text = text;
		this.length = text.length;
	}

	public chunk(from: number): string {
		return this.text.slice(from);
	}

	public read(from: number, to: number): string {
		return this.text.slice(from, to);
	}
}
