import { tokenize } from './tokenizer/tokenizer';
import { Parser } from './parser';
import { Evaluator } from './evaluator';
import { UnitValue } from './utils/unitValue';
import { ComplexNumber } from './utils/complexNumber';
import { FunctionDefinitionNode } from './ast';
import { constants } from './constants';

// Define your test cases
const tests = [
	{
		name: 'Basic Arithmetic and Built-in Functions',
		expression: `result = (2 + 3) * 4 - sqrt(16) / sin(pi / 2);`,
	},
	{
		name: 'Implicit Multiplication and Variables',
		expression: `r = 5;
area = pi r^2;`,
	},
	{
		name: 'User-defined Functions',
		expression: `circleArea(radius) = pi * radius^2;
result = circleArea(5);`,
	},
	{
		name: 'Array and Vectors',
		expression: `vectorA = [1, 2, 3];
vectorB = [4, 5, 6];
dotProduct = vectorA[0]*vectorB[0] + vectorA[1]*vectorB[1] + vectorA[2]*vectorB[2];`,
	},
	{
		name: 'Complex Numbers',
		expression: `z = 3 + 4i;
modulus = sqrt(z.real^2 + z.imag^2);`,
	},
	{
		name: 'Differentiation (Placeholder Implementation)',
		expression: `f(x) = x^3 + 2x;
dfdx = d/dx f(x);`,
	},
	{
		name: 'Logical and Conditional Expressions',
		expression: `max(a, b) = if(a > b, a, b);
result = max(10, 20);`,
	},
	{
		name: 'Evaluation with Units (Placeholder Implementation)',
		expression: `speed = 60 km/h;
time = 2 h;
distance = speed * time;
`,
	},
	{
		name: 'Lambda Expressions (Placeholder Implementation)',
		expression: `square = ->(x) x^2;
result = square(5);`,
	},
	{
		name: 'Multiple Statements and Enhanced Parentheses',
		expression: `{
  a = 5;
  b = 10;
  c = (a + b) * (a - b);
  result = c / 2;
}`,
	},
	{
		name: 'Implicit Multiplication with Functions',
		expression: `result = 2sin(pi / 3) + 3cos(pi / 6);`,
	},
	{
		name: 'Recursive Functions',
		expression: `factorial(n) = if(n <= 1, 1, n * factorial(n - 1));
result = factorial(5);`,
	},
	{
		name: 'Function Overloading and Higher-Order Functions',
		expression: `applyFunction(f, x) = f(x);
square(x) = x^2;
cube(x) = x^3;
result1 = applyFunction(square, 3);
result2 = applyFunction(cube, 3);`,
	},
	{
		name: 'Complex Arithmetic (Placeholder Implementation)',
		expression: `z1 = 2 + 3i;
z2 = 1 - 4i;
sum = z1 + z2;
product = z1 * z2;`,
	},
	{
		name: 'Implicit Multiplication with Parentheses',
		expression: `result = 2(x + 3)(x - 4);`,
	},
	{
		name: 'Matrix Operations (Placeholder Implementation)',
		expression: `A = [[1, 2], [3, 4]];
B = [[5, 6], [7, 8]];
C = A * B;`,
	},
	{
		name: 'Use of Brackets and Braces',
		expression: `{
  x = [1, 2, 3];
  y = {a: 10, b: 20};
  z = x[1] + y['b'];
}`,
	},
	{
		name: 'Logical Operators',
		expression: `isAdult(age) = age >= 18;
result = isAdult(20) && true;`,
	},
	{
		name: 'Ternary Conditional Expressions',
		expression: `grade(score) = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'F';
result = grade(85);`,
	},
];

for (let expression of tests) {
	try {
		const tokens = tokenize(expression.expression);
		const parser = new Parser(tokens);
		const ast = parser.parse();

		const evaluator = new Evaluator();
		const result = evaluator.evaluate(ast);

		if (result instanceof UnitValue) {
			console.log(
				expression.name,
				'Result:',
				`${result.value} ${result.unit}`
			);
		} else {
			console.log(expression.name, 'Result:', result);
		}
	} catch (error: any) {
		console.error('ERR', error?.message);
	}
}
