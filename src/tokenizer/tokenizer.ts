import { Token, TokenType } from './types';
import { ParseError } from '../errors';
import { constants } from '../constants';
import { unitRegistry } from '../utils/unitValue';

export function tokenize(expr: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	let line = 1;
	let column = 1;

	const builtInFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'];
	const units = Object.keys(unitRegistry);

	while (i < expr.length) {
		let char = expr[i];

		if (char === '\n') {
			line++;
			column = 1;
			i++;
			continue;
		}

		if (/\s/.test(char)) {
			i++;
			column++;
			continue;
		}

		// Number parsing
		if (/[0-9.]/.test(char)) {
			let numStr = char;
			i++;
			column++;
			while (i < expr.length && /[0-9.]/.test(expr[i])) {
				numStr += expr[i];
				i++;
				column++;
			}
			let identifier = '';
			if (i < expr.length && /[a-zA-Z]/.test(expr[i])) {
				while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) {
					identifier += expr[i];
					i++;
					column++;
				}
				if (units.includes(identifier)) {
					tokens.push({
						type: 'number',
						value: numStr,
						line,
						column,
					});
					tokens.push({
						type: 'unit',
						value: identifier,
						line,
						column,
					});
				} else {
					// Insert implicit multiplication
					tokens.push({
						type: 'number',
						value: numStr,
						line,
						column,
					});
					tokens.push({ type: 'operator', value: '*', line, column });
					tokens.push({
						type: 'identifier',
						value: identifier,
						line,
						column,
					});
				}
			} else {
				tokens.push({ type: 'number', value: numStr, line, column });
			}
			continue;
		}

		// Identifier or Constant
		if (/[a-zA-Z_]/.test(char)) {
			let name = char;
			i++;
			column++;
			while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
				name += expr[i];
				i++;
				column++;
			}
			if (constants.hasOwnProperty(name)) {
				tokens.push({ type: 'constant', value: name, line, column });
			} else if (builtInFunctions.includes(name)) {
				tokens.push({ type: 'function', value: name, line, column });
			} else if (units.includes(name)) {
				tokens.push({ type: 'unit', value: name, line, column });
			} else {
				tokens.push({ type: 'identifier', value: name, line, column });
			}
			continue;
		}

		// Operators and Punctuation
		if (char === '&' && expr[i + 1] === '&') {
			tokens.push({ type: 'operator', value: '&&', line, column });
			i += 2;
			column += 2;
			continue;
		}

		if (char === '|' && expr[i + 1] === '|') {
			tokens.push({ type: 'operator', value: '||', line, column });
			i += 2;
			column += 2;
			continue;
		}

		if (char === '?') {
			tokens.push({ type: 'question', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (char === ':') {
			tokens.push({ type: 'colon', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (char === '-' && expr[i + 1] === '>') {
			tokens.push({ type: 'arrow', value: '->', line, column });
			i += 2;
			column += 2;
			continue;
		}

		if (char === '=' && expr[i + 1] !== '=') {
			tokens.push({ type: 'equal', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (['+', '-', '*', '/', '^', '%'].includes(char)) {
			tokens.push({ type: 'operator', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (['!', '=', '<', '>'].includes(char)) {
			let op = char;
			i++;
			column++;
			if (i < expr.length && expr[i] === '=') {
				op += expr[i];
				i++;
				column++;
			}
			tokens.push({ type: 'operator', value: op, line, column });
			continue;
		}

		if (char === ';') {
			tokens.push({ type: 'semicolon', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (char === ',') {
			tokens.push({ type: 'comma', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (['(', ')'].includes(char)) {
			tokens.push({ type: 'paren', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (['[', ']'].includes(char)) {
			tokens.push({ type: 'bracket', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (['{', '}'].includes(char)) {
			tokens.push({ type: 'brace', value: char, line, column });
			i++;
			column++;
			continue;
		}

		if (char === "'") {
			let str = '';
			i++;
			column++;
			while (i < expr.length && expr[i] !== "'") {
				str += expr[i];
				i++;
				column++;
			}
			if (expr[i] !== "'") {
				throw new ParseError(
					'Unterminated string literal',
					line,
					column
				);
			}
			i++;
			column++;
			tokens.push({ type: 'string', value: str, line, column });
			continue;
		}

		if (char === '/' && expr[i + 1] === '/') {
			// Line comment
			while (i < expr.length && expr[i] !== '\n') {
				i++;
				column++;
			}
			continue;
		}

		if (char === '/' && expr[i + 1] === '*') {
			// Block comment
			i += 2;
			column += 2;
			while (
				i < expr.length &&
				!(expr[i] === '*' && expr[i + 1] === '/')
			) {
				if (expr[i] === '\n') {
					line++;
					column = 1;
				} else {
					column++;
				}
				i++;
			}
			i += 2;
			column += 2;
			continue;
		}

		// Unrecognized character
		throw new ParseError(`Unrecognized character '${char}'`, line, column);
	}

	return tokens;
}
