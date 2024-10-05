export class ParseError extends Error {
	line: number;
	column: number;

	constructor(message: string, line: number, column: number) {
		super(`Parse Error at (${line}, ${column}): ${message}`);
		this.line = line;
		this.column = column;
		Object.setPrototypeOf(this, ParseError.prototype);
	}
}
