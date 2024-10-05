export type TokenType =
	| 'number'
	| 'operator'
	| 'paren'
	| 'variable'
	| 'function'
	| 'comma'
	| 'equal'
	| 'string'
	| 'constant'
	| 'keyword'
	| 'unit'
	| 'arrow'
	| 'semicolon'
	| 'bracket'
	| 'brace'
	| 'identifier'
	| 'question'
	| 'colon';

export interface Token {
	type: TokenType;
	value: string;
	line: number;
	column: number;
}
