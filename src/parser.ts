import { Token, TokenType } from './tokenizer/types';
import { ParseError } from './errors';
import {
	ASTNode,
	BlockNode,
	AssignmentNode,
	BinaryOpNode,
	ConditionalNode,
	DerivativeNode,
	FunctionDefinitionNode,
	FunctionNode,
	LambdaNode,
	MatrixNode,
	NumberNode,
	PropertyAccessNode,
	StringNode,
	UnitNode,
	UnaryOpNode,
	VariableNode,
	ArrayNode,
} from './ast';
import { constants } from './constants';

export class Parser {
	tokens: Token[];
	pos: number = 0;
	currentToken: Token | null;
	symbolTable: Map<string, any>;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.currentToken = this.tokens[this.pos] || null;
		this.symbolTable = new Map();
	}

	advance(): void {
		this.currentToken = this.tokens[++this.pos] || null;
	}

	match(type?: TokenType, value?: string): boolean {
		if (!this.currentToken) return false;
		return (
			(!type || this.currentToken.type === type) &&
			(!value || this.currentToken.value === value)
		);
	}

	eat(type?: TokenType, value?: string): Token {
		if (this.match(type, value)) {
			const token = this.currentToken!;
			this.advance();
			return token;
		} else {
			const token = this.currentToken;
			throw new ParseError(
				`Unexpected token '${
					token ? token.value : 'EOF'
				}', expected '${value}'`,
				token ? token.line : -1,
				token ? token.column : -1
			);
		}
	}

	parse(): ASTNode {
		const statements = [];
		while (this.currentToken) {
			statements.push(this.parseStatement());
			if (this.match('semicolon')) {
				this.eat('semicolon');
			}
		}
		return new BlockNode(statements);
	}

	parseStatement(): ASTNode {
		if (this.match('brace', '{')) {
			return this.parseBlock();
		}
		if (
			this.match('identifier') &&
			this.tokens[this.pos + 1]?.type === 'paren' &&
			this.tokens[this.pos + 1]?.value === '(' &&
			this.lookaheadForFunctionDefinition()
		) {
			const name = this.eat('identifier').value;
			this.eat('paren', '(');
			const params: string[] = [];
			if (!this.match('paren', ')')) {
				params.push(this.eat('identifier').value);
				while (this.match('comma')) {
					this.eat('comma');
					params.push(this.eat('identifier').value);
				}
			}
			this.eat('paren', ')');
			this.eat('equal');
			const body = this.parseExpression();
			return new FunctionDefinitionNode(name, params, body);
		} else if (
			this.match('identifier') &&
			this.tokens[this.pos + 1]?.type === 'equal'
		) {
			const variable = this.parseVariable();
			this.eat('equal');
			return new AssignmentNode(variable, this.parseExpression());
		}

		return this.parseExpression();
	}

	parseBlock(): ASTNode {
		this.eat('brace', '{');
		const statements = [];
		while (!this.match('brace', '}')) {
			statements.push(this.parseStatement());
			if (this.match('semicolon')) this.eat('semicolon');
		}
		this.eat('brace', '}');
		return new BlockNode(statements);
	}

	lookaheadForFunctionDefinition(): boolean {
		let pos = this.pos;
		if (
			this.tokens[pos]?.type === 'identifier' &&
			this.tokens[pos + 1]?.value === '('
		) {
			pos += 2;
			while (this.tokens[pos] && this.tokens[pos].type !== 'paren') {
				pos++;
			}
			if (
				this.tokens[pos]?.type === 'paren' &&
				this.tokens[pos]?.value === ')'
			)
				return this.tokens[pos + 1]?.type === 'equal';
		}
		return false;
	}

	parseExpression(): ASTNode {
		return this.parseConditional();
	}

	parseLogicalOr(): ASTNode {
		let node = this.parseLogicalAnd();
		while (this.match('operator', '||')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseLogicalAnd()
			);
		}
		return node;
	}

	parseLogicalAnd(): ASTNode {
		let node = this.parseEquality();
		while (this.match('operator', '&&')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseEquality()
			);
		}
		return node;
	}

	parseEquality(): ASTNode {
		let node = this.parseComparison();
		while (this.match('operator', '==') || this.match('operator', '!=')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseComparison()
			);
		}
		return node;
	}

	parseComparison(): ASTNode {
		let node = this.parseTerm();
		while (
			this.match('operator', '<') ||
			this.match('operator', '>') ||
			this.match('operator', '<=') ||
			this.match('operator', '>=')
		) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseTerm()
			);
		}
		return node;
	}

	parseConditional(): ASTNode {
		let condition = this.parseLogicalOr();
		if (this.match('question')) {
			this.eat('question');
			const trueExpr = this.parseConditional();
			this.eat('colon');
			return new ConditionalNode(
				condition,
				trueExpr,
				this.parseConditional()
			);
		}
		return condition;
	}

	parseTerm(): ASTNode {
		let node = this.parseFactor();
		while (this.match('operator', '+') || this.match('operator', '-')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseFactor()
			);
		}
		return node;
	}

	parseFactor(): ASTNode {
		let node = this.parseExponent();
		while (this.match('operator', '*') || this.match('operator', '/')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseExponent()
			);
		}
		return node;
	}

	parseExponent(): ASTNode {
		let node = this.parseUnary();
		while (this.match('operator', '^')) {
			node = new BinaryOpNode(
				this.eat('operator').value,
				node,
				this.parseUnary()
			);
		}
		return node;
	}

	parseUnary(): ASTNode {
		if (this.match('operator', '+') || this.match('operator', '-')) {
			return new UnaryOpNode(
				this.eat('operator').value,
				this.parseUnary()
			);
		}
		return this.parsePostfix();
	}

	parsePostfix(): ASTNode {
		let node = this.parseImplicitMultiplication();

		while (this.match('operator', '!')) {
			node = new UnaryOpNode('!', node, true);
			this.eat('operator', '!');
		}

		return node;
	}

	parseImplicitMultiplication(): ASTNode {
		let node = this.parsePrimary();

		while (
			this.match('number') ||
			this.match('variable') ||
			this.match('function') ||
			this.match('constant') ||
			this.match('identifier') ||
			this.match('paren', '(') ||
			this.match('bracket', '[') ||
			this.match('brace', '{')
		) {
			node = new BinaryOpNode('*', node, this.parsePrimary());
		}

		return node;
	}

	parsePrimary(): ASTNode {
		if (this.match('number')) {
			const numberToken = this.eat('number');
			const value = parseFloat(numberToken.value);

			if (this.match('unit')) {
				const numeratorUnit = this.eat('unit').value;

				if (this.match('operator', '/')) {
					this.eat('operator', '/');
					if (this.match('unit')) {
						const denominatorUnit = this.eat('unit').value;
						const compoundUnit = `${numeratorUnit}/${denominatorUnit}`;
						return new UnitNode(
							new NumberNode(value),
							compoundUnit
						);
					} else {
						throw new ParseError(
							`Expected unit after '/'`,
							this.currentToken ? this.currentToken.line : -1,
							this.currentToken ? this.currentToken.column : -1
						);
					}
				} else if (this.match('operator', '*')) {
					this.eat('operator', '*');
					const nextToken = this.currentToken;
					if (nextToken?.type === 'unit') {
						const nextUnit = this.eat('unit').value;
						const compoundUnit = `${numeratorUnit}*${nextUnit}`;
						return new UnitNode(
							new NumberNode(value),
							compoundUnit
						);
					} else {
						return new UnitNode(
							new NumberNode(value),
							numeratorUnit
						);
					}
				}

				return new UnitNode(new NumberNode(value), numeratorUnit);
			} else {
				return new NumberNode(value);
			}
		}

		if (
			this.match('identifier', 'd') &&
			this.tokens[this.pos + 1]?.type === 'operator' &&
			this.tokens[this.pos + 1]?.value === '/' &&
			this.tokens[this.pos + 2]?.type === 'identifier' &&
			this.tokens[this.pos + 2]?.value.startsWith('d')
		) {
			return this.parseDerivative();
		}

		if (this.match('identifier', 'if')) {
			this.eat('identifier', 'if');
			if (this.match('paren', '(')) {
				// Function-like if(condition, trueExpr, falseExpr)
				this.eat('paren', '(');
				const condition = this.parseExpression();
				this.eat('comma');
				const trueExpr = this.parseExpression();
				this.eat('comma');
				const falseExpr = this.parseExpression();
				this.eat('paren', ')');
				return new ConditionalNode(condition, trueExpr, falseExpr);
			} else {
				// Original syntax if (condition) trueExpr else falseExpr
				this.eat('paren', '(');
				const condition = this.parseExpression();
				this.eat('paren', ')');
				const trueExpr = this.parseExpression();
				this.eat('keyword', 'else');
				const falseExpr = this.parseExpression();
				return new ConditionalNode(condition, trueExpr, falseExpr);
			}
		}

		if (this.match('function')) {
			const funcName = this.eat('function').value;
			this.eat('paren', '(');
			const args = this.parseArguments();
			this.eat('paren', ')');
			return new FunctionNode(funcName, args);
		}

		if (this.match('identifier')) {
			const name = this.eat('identifier').value;
			let node: ASTNode = new VariableNode(name);

			while (this.match('operator', '.')) {
				this.eat('operator', '.');
				const propertyName = this.eat('identifier').value;
				node = new PropertyAccessNode(node, propertyName);
			}

			while (this.match('bracket', '[')) {
				this.eat('bracket', '[');
				const index = this.parseExpression();
				this.eat('bracket', ']');
				node = new BinaryOpNode('[]', node, index);
			}

			if (this.match('paren', '(')) {
				this.eat('paren', '(');
				const args = this.parseArguments();
				this.eat('paren', ')');
				return new FunctionNode(name, args);
			} else {
				return node;
			}
		}

		if (this.match('paren', '(')) {
			this.eat('paren', '(');
			const node = this.parseExpression();
			this.eat('paren', ')');
			return node;
		}

		if (this.match('bracket', '[')) {
			return this.parseArray();
		}

		if (this.match('arrow')) {
			return this.parseLambda();
		}

		if (this.match('string')) {
			const strValue = this.eat('string').value;
			return new StringNode(strValue);
		}

		if (this.match('constant')) {
			const constantName = this.eat('constant').value;
			const constantValue = constants[constantName];

			if (!constantValue) {
				throw new ParseError(
					`Unexpected token '${
						this.currentToken ? this.currentToken.value : 'EOF'
					}'`,
					this.currentToken ? this.currentToken.line : -1,
					this.currentToken ? this.currentToken.column : -1
				);
			}

			return new NumberNode(constantValue);
		}

		throw new ParseError(
			`Unexpected token '${
				this.currentToken ? this.currentToken.value : 'EOF'
			}'`,
			this.currentToken ? this.currentToken.line : -1,
			this.currentToken ? this.currentToken.column : -1
		);
	}

	parseVariable(): ASTNode {
		const name = this.eat('identifier').value;
		return new VariableNode(name);
	}

	parseArguments(): ASTNode[] {
		const args: ASTNode[] = [];

		if (!this.match('paren', ')')) {
			args.push(this.parseExpression());

			while (this.match('comma')) {
				this.eat('comma');
				args.push(this.parseExpression());
			}
		}

		return args;
	}

	parseArray(): ASTNode {
		this.eat('bracket', '[');
		const elements: ASTNode[] = [];

		if (!this.match('bracket', ']')) {
			elements.push(this.parseArrayElements());

			while (this.match('comma')) {
				this.eat('comma');
				elements.push(this.parseArrayElements());
			}
		}

		this.eat('bracket', ']');

		if (elements.length > 0 && elements[0] instanceof ArrayNode) {
			// Matrix
			return new MatrixNode(
				elements.map((row) => (row as ArrayNode).elements)
			);
		} else {
			// Regular array
			return new ArrayNode(elements);
		}
	}

	parseDerivative(): ASTNode {
		// d/dx(expression)
		this.eat('identifier', 'd');
		this.eat('operator', '/');
		this.eat('identifier', 'd');
		const variableName = this.eat('identifier').value;
		const variable = new VariableNode(variableName);
		let expression: ASTNode;
		if (this.match('paren', '(')) {
			this.eat('paren', '(');
			expression = this.parseExpression();
			this.eat('paren', ')');
		} else {
			expression = this.parseExpression();
		}
		return new DerivativeNode(variable, expression);
	}

	parseLambda(): ASTNode {
		this.eat('arrow', '->');
		let params: string[] = [];
		if (this.match('paren', '(')) {
			this.eat('paren', '(');
			if (!this.match('paren', ')')) {
				params.push(this.eat('identifier').value);
				while (this.match('comma')) {
					this.eat('comma');
					params.push(this.eat('identifier').value);
				}
			}
			this.eat('paren', ')');
		} else {
			params.push(this.eat('identifier').value);
		}
		const body = this.parseExpression();
		return new LambdaNode(params, body);
	}

	parseArrayElements(): ASTNode {
		if (this.match('bracket', '[')) {
			return this.parseArray();
		} else {
			return this.parseExpression();
		}
	}
}
