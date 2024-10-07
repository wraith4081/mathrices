export abstract class ASTNode {
	abstract type: string;
}

export class NumberNode extends ASTNode {
	type = 'Number';
	value: number;

	constructor(value: number) {
		super();
		this.value = value;
	}
}

export class StringNode extends ASTNode {
	type = 'String';
	value: string;

	constructor(value: string) {
		super();
		this.value = value;
	}
}

export class VariableNode extends ASTNode {
	type = 'Variable';
	name: string;

	constructor(name: string) {
		super();
		this.name = name;
	}
}

export class BinaryOpNode extends ASTNode {
	type = 'BinaryOp';
	operator: string;
	left: ASTNode;
	right: ASTNode;

	constructor(operator: string, left: ASTNode, right: ASTNode) {
		super();
		this.operator = operator;
		this.left = left;
		this.right = right;
	}
}

export class UnaryOpNode extends ASTNode {
	type = 'UnaryOp';
	operator: string;
	operand: ASTNode;
	isPostfix: boolean;

	constructor(
		operator: string,
		operand: ASTNode,
		isPostfix: boolean = false
	) {
		super();
		this.operator = operator;
		this.operand = operand;
		this.isPostfix = isPostfix;
	}
}

export class FunctionNode extends ASTNode {
	type = 'Function';
	name: string;
	args: ASTNode[];

	constructor(name: string, args: ASTNode[]) {
		super();
		this.name = name;
		this.args = args;
	}
}

export class AssignmentNode extends ASTNode {
	type = 'Assignment';
	variable: ASTNode;
	value: ASTNode;

	constructor(variable: ASTNode, value: ASTNode) {
		super();
		this.variable = variable;
		this.value = value;
	}
}

export class FunctionDefinitionNode extends ASTNode {
	type = 'FunctionDefinition';
	name: string;
	params: string[];
	body: ASTNode;

	constructor(name: string, params: string[], body: ASTNode) {
		super();
		this.name = name;
		this.params = params;
		this.body = body;
	}
}

export class ArrayNode extends ASTNode {
	type = 'Array';
	elements: ASTNode[];

	constructor(elements: ASTNode[]) {
		super();
		this.elements = elements;
	}
}

export class MatrixNode extends ASTNode {
	type = 'Matrix';
	rows: ASTNode[][];

	constructor(rows: ASTNode[][]) {
		super();
		this.rows = rows;
	}
}

export class ComplexNumberNode extends ASTNode {
	type = 'ComplexNumber';
	real: ASTNode;
	imag: ASTNode;

	constructor(real: ASTNode, imag: ASTNode) {
		super();
		this.real = real;
		this.imag = imag;
	}
}

export class DerivativeNode extends ASTNode {
	type = 'Derivative';
	variable: VariableNode;
	expression: ASTNode;

	constructor(variable: VariableNode, expression: ASTNode) {
		super();
		this.variable = variable;
		this.expression = expression;
	}
}

export class ConditionalNode extends ASTNode {
	type = 'Conditional';
	condition: ASTNode;
	trueExpr: ASTNode;
	falseExpr: ASTNode;

	constructor(condition: ASTNode, trueExpr: ASTNode, falseExpr: ASTNode) {
		super();
		this.condition = condition;
		this.trueExpr = trueExpr;
		this.falseExpr = falseExpr;
	}
}

export class LambdaNode extends ASTNode {
	type = 'Lambda';
	params: string[];
	body: ASTNode;

	constructor(params: string[], body: ASTNode) {
		super();
		this.params = params;
		this.body = body;
	}
}

export class UnitNode extends ASTNode {
	type = 'Unit';
	value: ASTNode;
	unit: string;

	constructor(value: ASTNode, unit: string) {
		super();
		this.value = value;
		this.unit = unit;
	}
}

export class BlockNode extends ASTNode {
	type = 'Block';
	statements: ASTNode[];

	constructor(statements: ASTNode[]) {
		super();
		this.statements = statements;
	}
}

export class PropertyAccessNode extends ASTNode {
	type = 'PropertyAccess';
	object: ASTNode;
	property: string;

	constructor(object: ASTNode, property: string) {
		super();
		this.object = object;
		this.property = property;
	}
}
