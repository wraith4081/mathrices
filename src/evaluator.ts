import {
	ASTNode,
	NumberNode,
	VariableNode,
	BinaryOpNode,
	UnaryOpNode,
	FunctionNode,
	AssignmentNode,
	FunctionDefinitionNode,
	ArrayNode,
	MatrixNode,
	ComplexNumberNode,
	ConditionalNode,
	LambdaNode,
	UnitNode,
	BlockNode,
	PropertyAccessNode,
	StringNode,
	DerivativeNode,
} from './ast';
import { constants, functions } from './constants';
import { ComplexNumber } from './utils/complexNumber';
import { UnitValue } from './utils/unitValue';

export class Evaluator {
	context: Map<string, any>;

	constructor(context?: Map<string, any>) {
		this.context = context || new Map();
	}

	evaluate(node: ASTNode): any {
		if (node instanceof NumberNode) {
			return node.value;
		} else if (node instanceof VariableNode) {
			if (this.context.has(node.name)) {
				return this.context.get(node.name);
			} else if (constants.hasOwnProperty(node.name)) {
				return constants[node.name];
			} else {
				throw new Error(`Undefined variable '${node.name}'`);
			}
		} else if (node instanceof UnitNode) {
			const value = this.evaluate(node.value);
			const unitStr = node.unit;
			return new UnitValue(value, unitStr);
		} else if (node instanceof ComplexNumberNode) {
			return new ComplexNumber(
				this.evaluate(node.real),
				this.evaluate(node.imag)
			);
		} else if (node instanceof PropertyAccessNode) {
			const obj = this.evaluate(node.object);
			if (obj instanceof ComplexNumber) {
				if (node.property === 'real') {
					return obj.real;
				} else if (node.property === 'imag') {
					return obj.imag;
				} else {
					throw new Error(
						`Unknown property '${node.property}' on complex number`
					);
				}
			} else if (obj instanceof UnitValue) {
				if (node.property === 'value') {
					return obj.value;
				} else if (node.property === 'unit') {
					return obj.unit;
				} else {
					throw new Error(
						`Unknown property '${node.property}' on UnitValue`
					);
				}
			} else {
				throw new Error(
					`Property access not supported on type '${typeof obj}'`
				);
			}
		} else if (node instanceof ConditionalNode) {
			return this.evaluate(
				this.evaluate(node.condition) ? node.trueExpr : node.falseExpr
			);
		} else if (node instanceof MatrixNode) {
			return node.rows.map((row) =>
				row.map((element) => this.evaluate(element))
			);
		} else if (node instanceof LambdaNode) {
			return (...args: any[]) => {
				const lambdaEvaluator = new Evaluator(new Map(this.context));
				if (node.params.length !== args.length) {
					throw new Error(
						`Lambda expects ${node.params.length} arguments, got ${args.length}`
					);
				}
				for (let i = 0; i < node.params.length; i++) {
					lambdaEvaluator.context.set(node.params[i], args[i]);
				}
				return lambdaEvaluator.evaluate(node.body);
			};
		} else if (node instanceof BinaryOpNode) {
			const left = this.evaluate(node.left);
			const right = this.evaluate(node.right);

			if (
				left instanceof ComplexNumber ||
				right instanceof ComplexNumber
			) {
				const complexLeft =
					left instanceof ComplexNumber
						? left
						: new ComplexNumber(left, 0);
				const complexRight =
					right instanceof ComplexNumber
						? right
						: new ComplexNumber(right, 0);

				switch (node.operator) {
					case '+':
						return complexLeft.add(complexRight);
					case '-':
						return complexLeft.subtract(complexRight);
					case '*':
						return complexLeft.multiply(complexRight);
					case '/':
						return complexLeft.divide(complexRight);
					default:
						throw new Error(
							`Unsupported operator '${node.operator}' for complex numbers`
						);
				}
			}

			if (left instanceof UnitValue || right instanceof UnitValue) {
				const unitLeft =
					left instanceof UnitValue ? left : new UnitValue(left, '');
				const unitRight =
					right instanceof UnitValue
						? right
						: new UnitValue(right, '');

				switch (node.operator) {
					case '+':
					case '-':
						// Enforce dimensional consistency
						if (
							!UnitValue.areUnitsCompatible(
								unitLeft.units,
								unitRight.units
							)
						) {
							throw new Error(
								`Cannot ${
									node.operator
								} values with different or incompatible units: '${unitLeft.formatUnit()}' and '${unitRight.formatUnit()}'`
							);
						}
						// Convert right to left's unit
						const convertedRight = unitRight.convertTo(
							unitLeft.formatUnit()
						);
						const resultValue =
							node.operator === '+'
								? unitLeft.value + convertedRight.value
								: unitLeft.value - convertedRight.value;
						return new UnitValue(
							resultValue,
							unitLeft.formatUnit()
						);
					case '*':
						return unitLeft.multiply(unitRight);
					case '/':
						return unitLeft.divide(unitRight);
					case '^':
						if (typeof right === 'number') {
							// Exponentiation logic
							const newValue = Math.pow(unitLeft.value, right);
							const newUnits = new Map<string, number>();
							unitLeft.units.forEach((exp, unit) => {
								newUnits.set(unit, exp * right);
							});
							const unitStr = UnitValue.formatUnitFromMap(newUnits);
							return new UnitValue(newValue, unitStr);
						} else {
							throw new Error('Exponent must be a number');
						}
					default:
						throw new Error(
							`Unsupported operator '${node.operator}' for units`
						);
				}
			}

			if (typeof left === 'string' || typeof right === 'string') {
				if (node.operator === '+') {
					return left.toString() + right.toString();
				} else {
					throw new Error(
						`Unsupported operator '${node.operator}' for strings`
					);
				}
			}

			// Handle arrays (vectors) and matrices
			if (node.operator === '[]') {
				if (Array.isArray(left)) {
					return left[right];
				} else {
					throw new Error(
						`Cannot index non-array type with '[]' operator`
					);
				}
			}

			if (Array.isArray(left) && Array.isArray(right)) {
				switch (node.operator) {
					case '+':
						return this.addMatrices(left, right);
					case '-':
						return this.addMatrices(
							left,
							right.map((row) =>
								row.map((value: number) => -value)
							)
						);
					case '*':
						if (left[0].length !== right.length) {
							throw new Error(
								'Matrix dimensions do not match for multiplication'
							);
						}
						const result: number[][] = [];
						for (let i = 0; i < left.length; i++) {
							result[i] = [];
							for (let j = 0; j < right[0].length; j++) {
								let sum = 0;
								for (let k = 0; k < right.length; k++) {
									sum += left[i][k] * right[k][j];
								}
								result[i][j] = sum;
							}
						}
						return result;
					case '/':
						throw new Error(
							'Division of matrices not supported yet'
						);
					default:
						throw new Error(
							`Unsupported operator '${node.operator}' for arrays`
						);
				}
			}

			if (
				node.operator === '*' &&
				Array.isArray(left) &&
				Array.isArray(right)
			) {
				return this.multiplyMatrices(left, right);
			}

			switch (node.operator) {
				case '+':
					return left + right;
				case '-':
					return left - right;
				case '*':
					if (Array.isArray(left)) {
						// Left is a matrix, right is a scalar
						return left.map((row: number[]) =>
							row.map((value) => value * right)
						);
					} else if (Array.isArray(right)) {
						// Right is a matrix, left is a scalar
						return right.map((row: number[]) =>
							row.map((value) => left * value)
						);
					} else {
						// Scalar multiplication
						return left * right;
					}
				case '/':
					return left / right;
				case '^':
					return Math.pow(left, right);
				case '&&':
					return left && right;
				case '||':
					return left || right;
				case '==':
					return left == right;
				case '!=':
					return left != right;
				case '<':
					return left < right;
				case '>':
					return left > right;
				case '<=':
					return left <= right;
				case '>=':
					return left >= right;
				default:
					throw new Error(`Unsupported operator '${node.operator}'`);
			}
		} else if (node instanceof UnaryOpNode) {
			if (node.isPostfix) {
				if (node.operator === '!') {
					const operand = this.evaluate(node.operand);
					return functions.factorial([operand]);
				} else {
					throw new Error(
						`Unsupported postfix operator '${node.operator}'`
					);
				}
			} else {
				const operand = this.evaluate(node.operand);
				if (operand instanceof UnitValue) {
					// Handle unary operations on UnitValue
					switch (node.operator) {
						case '+':
							return operand;
						case '-':
							return new UnitValue(
								-operand.value,
								operand.formatUnit()
							);
						default:
							throw new Error(
								`Unsupported unary operator '${node.operator}' for units`
							);
					}
				}
				switch (node.operator) {
					case '+':
						return +operand;
					case '-':
						return -operand;
					default:
						throw new Error(
							`Unsupported unary operator '${node.operator}'`
						);
				}
			}
		} else if (node instanceof FunctionNode) {
			const args = node.args.map((arg) => this.evaluate(arg));

			if (node.name in functions) {
				return functions?.[node.name as keyof typeof functions]?.(args);
			}

			if (this.context.has(node.name)) {
				const func = this.context.get(node.name);
				if (func instanceof FunctionDefinitionNode) {
					const funcEvaluator = new Evaluator(new Map(this.context));
					if (func.params.length !== args.length) {
						throw new Error(
							`Function '${node.name}' expects ${func.params.length} arguments, got ${args.length}`
						);
					}
					for (let i = 0; i < func.params.length; i++) {
						funcEvaluator.context.set(func.params[i], args[i]);
					}
					return funcEvaluator.evaluate(func.body);
				} else if (typeof func === 'function') {
					return func(...args);
				} else {
					throw new Error(`'${node.name}' is not a function`);
				}
			} else {
				throw new Error(`Undefined function '${node.name}'`);
			}
		} else if (node instanceof AssignmentNode) {
			const value = this.evaluate(node.value);
			if (node.variable instanceof VariableNode) {
				this.context.set(node.variable.name, value);
				return value;
			} else {
				throw new Error('Left side of assignment must be a variable');
			}
		} else if (node instanceof FunctionDefinitionNode) {
			this.context.set(node.name, node);
			return node;
		} else if (node instanceof ArrayNode) {
			return node.elements.map((element) => this.evaluate(element));
		} else if (node instanceof BlockNode) {
			let result;
			for (const stmt of node.statements) {
				result = this.evaluate(stmt);
			}
			return result;
		} else if (node instanceof DerivativeNode) {
			return this.differentiateAndEvaluate(
				node.expression,
				node.variable.name
			);
		} else if (node instanceof StringNode) {
			return node.value;
		} else {
			throw new Error(`Unsupported AST node type '${node.type}'`);
		}
	}

	differentiateAndEvaluate(
		expression: ASTNode,
		variable: string,
		evaluationContext?: Map<string, any>
	): any {
		const derivativeAST = this.differentiate(expression, variable);
		const tempEvaluator = new Evaluator(
			evaluationContext
				? new Map(evaluationContext)
				: new Map(this.context)
		);
		return tempEvaluator.evaluate(derivativeAST);
	}

	differentiate(node: ASTNode, variable: string): ASTNode {
		if (node instanceof NumberNode) {
			return new NumberNode(0);
		} else if (node instanceof VariableNode) {
			return new NumberNode(node.name === variable ? 1 : 0);
		} else if (node instanceof BinaryOpNode) {
			const left = node.left;
			const right = node.right;
			switch (node.operator) {
				case '+':
				case '-':
					return new BinaryOpNode(
						node.operator,
						this.differentiate(left, variable),
						this.differentiate(right, variable)
					);
				case '*':
					// Product rule: (f * g)' = f' * g + f * g'
					return new BinaryOpNode(
						'+',
						new BinaryOpNode(
							'*',
							this.differentiate(left, variable),
							right
						),
						new BinaryOpNode(
							'*',
							left,
							this.differentiate(right, variable)
						)
					);
				case '/':
					// Quotient rule: (f / g)' = (f' * g - f * g') / g^2
					return new BinaryOpNode(
						'/',
						new BinaryOpNode(
							'-',
							new BinaryOpNode(
								'*',
								this.differentiate(left, variable),
								right
							),
							new BinaryOpNode(
								'*',
								left,
								this.differentiate(right, variable)
							)
						),
						new BinaryOpNode('^', right, new NumberNode(2))
					);
				case '^':
					if (right instanceof NumberNode) {
						// Power rule: (f^n)' = n * f^(n-1) * f'
						return new BinaryOpNode(
							'*',
							new BinaryOpNode(
								'*',
								new NumberNode(right.value),
								new BinaryOpNode(
									'^',
									left,
									new NumberNode(right.value - 1)
								)
							),
							this.differentiate(left, variable)
						);
					} else {
						throw new Error(
							'Differentiation of variable exponents not implemented'
						);
					}
				default:
					throw new Error(
						`Unsupported operator '${node.operator}' for differentiation`
					);
			}
		} else if (node instanceof FunctionNode) {
			const arg = node.args[0];
			const derivativeOfArg = this.differentiate(arg, variable);

			if (functions.hasOwnProperty(node.name)) {
				switch (node.name) {
					case 'sin':
						return new BinaryOpNode(
							'*',
							new FunctionNode('cos', [arg]),
							derivativeOfArg
						);
					case 'cos':
						return new BinaryOpNode(
							'*',
							new UnaryOpNode(
								'-',
								new FunctionNode('sin', [arg])
							),
							derivativeOfArg
						);
					case 'tan':
						return new BinaryOpNode(
							'*',
							new BinaryOpNode(
								'^',
								new BinaryOpNode(
									'/',
									new NumberNode(1),
									new FunctionNode('cos', [arg])
								),
								new NumberNode(2)
							),
							derivativeOfArg
						);
					case 'sqrt':
						return new BinaryOpNode(
							'*',
							new BinaryOpNode(
								'/',
								new NumberNode(1),
								new BinaryOpNode(
									'*',
									new NumberNode(2),
									new FunctionNode('sqrt', [arg])
								)
							),
							derivativeOfArg
						);
					case 'ln':
						return new BinaryOpNode(
							'*',
							new BinaryOpNode('/', new NumberNode(1), arg),
							derivativeOfArg
						);
					default:
						throw new Error(
							`Differentiation of built-in function '${node.name}' not implemented`
						);
				}
			} else if (this.context.has(node.name)) {
				const funcDef = this.context.get(node.name);
				if (funcDef instanceof FunctionDefinitionNode) {
					if (funcDef.params.length !== node.args.length) {
						throw new Error(
							`Function '${node.name}' expects ${funcDef.params.length} arguments, got ${node.args.length}`
						);
					}

					const substitutionMap = new Map<string, ASTNode>();
					for (let i = 0; i < funcDef.params.length; i++) {
						substitutionMap.set(funcDef.params[i], node.args[i]);
					}

					const substitutedBody = this.substitute(
						funcDef.body,
						substitutionMap
					);

					return this.differentiate(substitutedBody, variable);
				} else {
					throw new Error(`'${node.name}' is not a function`);
				}
			} else {
				throw new Error(`Undefined function '${node.name}'`);
			}
		} else if (node instanceof ConditionalNode) {
			throw new Error(
				'Differentiation of conditional expressions not implemented'
			);
		} else if (node instanceof UnaryOpNode) {
			if (node.operator === '-') {
				// d/dx (-f) = -f'
				return new UnaryOpNode(
					'-',
					this.differentiate(node.operand, variable)
				);
			}
			return this.differentiate(node.operand, variable);
		} else {
			throw new Error(
				`Unsupported node type '${node.type}' for differentiation`
			);
		}
	}

	substitute(node: ASTNode, substitutionMap: Map<string, ASTNode>): ASTNode {
		if (node instanceof NumberNode) {
			return node;
		} else if (node instanceof VariableNode) {
			if (substitutionMap.has(node.name)) {
				return substitutionMap.get(node.name)!;
			}
			return node;
		} else if (node instanceof BinaryOpNode) {
			return new BinaryOpNode(
				node.operator,
				this.substitute(node.left, substitutionMap),
				this.substitute(node.right, substitutionMap)
			);
		} else if (node instanceof FunctionNode) {
			const newArgs = node.args.map((arg) =>
				this.substitute(arg, substitutionMap)
			);
			return new FunctionNode(node.name, newArgs);
		} else if (node instanceof UnaryOpNode) {
			return new UnaryOpNode(
				node.operator,
				this.substitute(node.operand, substitutionMap)
			);
		} else if (node instanceof ConditionalNode) {
			return new ConditionalNode(
				this.substitute(node.condition, substitutionMap),
				this.substitute(node.trueExpr, substitutionMap),
				this.substitute(node.falseExpr, substitutionMap)
			);
		} else {
			throw new Error(
				`Substitution not implemented for node type '${node.type}'`
			);
		}
	}

	addMatrices(a: any[], b: any[]): any[] {
		if (a.length !== b.length || a[0].length !== b[0].length) {
			throw new Error('Matrix dimensions do not match for addition');
		}
		const result = [];
		for (let i = 0; i < a.length; i++) {
			const row = [];
			for (let j = 0; j < a[i].length; j++) {
				row.push(a[i][j] + b[i][j]);
			}
			result.push(row);
		}
		return result;
	}

	multiplyMatrices(a: number[][], b: number[][]): number[][] {
		if (a[0].length !== b.length) {
			throw new Error(
				'Matrix dimensions do not match for multiplication'
			);
		}
		const result: number[][] = [];
		for (let i = 0; i < a.length; i++) {
			result[i] = [];
			for (let j = 0; j < b[0].length; j++) {
				let sum = 0;
				for (let k = 0; k < b.length; k++) {
					sum += a[i][k] * b[k][j];
				}
				result[i][j] = sum;
			}
		}
		return result;
	}
}
