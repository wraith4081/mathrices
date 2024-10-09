import { ComplexNumber } from './utils/complexNumber';

export const constants: { [key: string]: any } = {
	pi: Math.PI,
	tau: 2 * Math.PI,
	phi: (1 + Math.sqrt(5)) / 2,
	e: Math.E,
	i: new ComplexNumber(0, 1),
	true: true,
	false: false,
};

export const functions = {
	acos: ([x]: any[]) => Math.acos(x),
	acosh: ([x]: any[]) => Math.acosh(x),
	acot: ([x]: any[]) => Math.atan(1 / x),
	acoth: ([x]: any[]) =>
		isFinite(x) ? (Math.log((x + 1) / x) + Math.log(x / (x - 1))) / 2 : 0,
	acsc: ([x]: any[]) => Math.asin(1 / x),
	acsch: ([x]: any[]) => {
		const xInv = 1 / x;
		return Math.log(xInv + Math.sqrt(xInv * xInv + 1));
	},
	asec: ([x]: any[]) => Math.acos(1 / x),
	asech: ([x]: any[]) => {
		const xInv = 1 / x;
		return Math.log(Math.sqrt(xInv * xInv - 1) + xInv);
	},
	asin: ([x]: any[]) => Math.asin(x),
	asinh: ([x]: any[]) => Math.asinh(x),
	atan: ([x]: any[]) => Math.atan(x),
	atan2: ([y, x]: any[]) => Math.atan2(y, x),
	atanh: ([x]: any[]) => Math.atanh(x),
	cos: ([x]: any[]) => Math.cos(x),
	cosh: ([x]: any[]) => Math.cosh(x),
	cot: ([x]: any[]) => 1 / Math.tan(x),
	coth: ([x]: any[]) => {
		const e = Math.exp(2 * x);
		return (e + 1) / (e - 1);
	},
	csc: ([x]: any[]) => 1 / Math.sin(x),
	csch: ([x]: any[]) =>
		x === 0
			? Number.POSITIVE_INFINITY
			: Math.abs(2 / (Math.exp(x) - Math.exp(-x))) * Math.sign(x),
	sec: ([x]: any[]) => 1 / Math.cos(x),
	sech: ([x]: any[]) => 2 / (Math.exp(x) + Math.exp(-x)),
	sin: ([x]: any[]) => Math.sin(x),
	sinh: ([x]: any[]) => Math.sinh(x),
	tan: ([x]: any[]) => Math.tan(x),
	tanh: ([x]: any[]) => Math.tanh(x),
	sqrt: ([x]: any[]) => Math.sqrt(x),
	log: ([x, y]: any[]) => Math.log(y) / Math.log(x ?? 10),
	ln: ([x]: any[]) => Math.log(x),
	log1p: ([x]: any[]) => Math.log1p(x),
	mod: ([x, y]: any[]) => (y === 0 ? x : x - y * Math.floor(x / y)),
	nthRoot: ([n, x]: any[]) => {
		if (n === 0) {
			throw new Error('The degree of the root (n) cannot be zero.');
		}
		if (x < 0 && n % 2 === 0) {
			throw new Error('Even root of negative number is not real.');
		}

		if (x === 0) return 0;

		let low = x < 1 && x > 0 ? 0 : 1;
		let high = Math.abs(x) < 1 ? 1 : Math.abs(x);
		let mid;
		let iteration = 0;

		while (iteration++ < 1000) {
			const midPow = Math.pow((mid = (low + high) / 2), n);

			if (Math.abs(midPow - Math.abs(x)) < 1e-7)
				return x < 0 ? -mid : mid;

			if (midPow < Math.abs(x)) {
				low = mid;
			} else {
				high = mid;
			}
		}

		throw new Error(
			'Exceeded maximum iterations. The method did not converge.'
		);
	},
	xgcd: ([a, b]: any[]): number => {
		if (!Number.isInteger(a) || !Number.isInteger(b)) {
			throw new Error('Extended GCD is only defined for integers.');
		}

		let old_r = a;
		let r = b;
		let old_s = 1;
		let s = 0;
		let old_t = 0;
		let t = 1;

		if (a === 0 && b === 0) {
			throw new Error(
				'Extended GCD is undefined for both numbers being zero.'
			);
		}

		while (r !== 0) {
			const quotient = Math.floor(old_r / r);

			[old_r, r] = [r, old_r - quotient * r];
			[old_s, s] = [s, old_s - quotient * s];
			[old_t, t] = [t, old_t - quotient * t];
		}

		return Math.abs(old_r);
	},
	gamma: ([z]: any[]): number => {
		const p = [
			0.99999999999980993, 676.5203681218851, -1259.1392167224028,
			771.32342877765313, -176.61502916214059, 12.507343278686905,
			-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
		];

		if (z < 0.5) {
			return Math.PI / (Math.sin(Math.PI * z) * functions.gamma([1 - z]));
		}

		z -= 1;
		let x = p[0];
		for (let i = 1; i < p.length; i++) {
			x += p[i] / (z + i);
		}
		const t = z + p.length - 0.5;
		return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
	},
	lgamma: ([z]: any[]): number => {
		const p = [
			0.99999999999980993, 676.5203681218851, -1259.1392167224028,
			771.32342877765313, -176.61502916214059, 12.507343278686905,
			-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
		];

		if (z < 0.5) {
			return (
				Math.log(Math.PI) -
				Math.log(Math.abs(Math.sin(Math.PI * z))) -
				functions.lgamma([1 - z])
			);
		}

		z -= 1;
		let x = p[0];
		for (let i = 1; i < p.length; i++) {
			x += p[i] / (z + i);
		}
		const t = z + p.length - 0.5;
		return (
			0.9189385332046727 +
			(z + 0.5) * Math.log(t) -
			t +
			Math.log(Math.abs(x))
		);
	},
	sign: ([x]: any[]) => Math.sign(x),
	exp: ([x]: any[]) => Math.exp(x),
	expm1: ([x]: any[]) => Math.expm1(x),
	abs: ([x]: any[]) => Math.abs(x),
	not: ([x]: any[]) => !x,
	and: ([x, y]: any[]) => !!(x && y),
	or: ([x, y]: any[]) => !!(x || y),
	xor: ([x, y]: any[]) => !!(x ^ y),
	round: ([x]: any[]) => Math.round(x),
	floor: ([x]: any[]) => Math.floor(x),
	ceil: ([x]: any[]) => Math.ceil(x),
	min: ([...args]: any[]) => Math.min(...args),
	max: ([...args]: any[]) => Math.max(...args),
	sum: ([...args]: any[]) => args.reduce((acc, x) => acc + x, 0),
	avg: ([...args]: any[]) =>
		args.reduce((acc, x) => acc + x, 0) / args.length,
	cbrt: ([x]: any[]) => Math.cbrt(x),
	Re: ([x]: any[]) => {
		if (x instanceof ComplexNumber) {
			return x.real;
		} else {
			throw new Error('Argument must be a complex number');
		}
	},
	Im: ([x]: any[]) => {
		if (x instanceof ComplexNumber) {
			return x.imag;
		} else {
			throw new Error('Argument must be a complex number');
		}
	},
	factorial: ([n]: any[]) => {
		if (n < 0) {
			throw new Error('Factorial is not defined for negative numbers');
		}
		if (!Number.isInteger(n)) {
			throw new Error('Factorial is only defined for integers');
		}
		let result = 1;
		for (let i = 2; i <= n; i++) {
			result *= i;
		}
		return result;
	},
	nCr: ([n, r]: any[]) => {
		if (n < r) {
			throw new Error('nCr is not defined for n < r');
		}
		if (!Number.isInteger(n) || !Number.isInteger(r)) {
			throw new Error('nCr is only defined for integers');
		}
		return (
			functions.factorial([n]) /
			(functions.factorial([r]) * functions.factorial([n - r]))
		);
	},
	gcd: ([a, b]: any[]) => {
		if (!Number.isInteger(a) || !Number.isInteger(b)) {
			throw new Error('GCD is only defined for integers.');
		}

		if ((a = Math.abs(a)) === 0 && (b = Math.abs(b)) === 0) {
			throw new Error('GCD is undefined for both numbers being zero.');
		}

		if (a === 0) return b;
		if (b === 0) return a;

		while (b !== 0) {
			const temp = b;
			b = a % b;
			a = temp;
		}

		return a;
	},
	lcm: ([a, b]: any[]): any => {
		if (!Number.isInteger(a) || !Number.isInteger(b)) {
			throw new Error('LCM is only defined for integers.');
		}

		return (a = Math.abs(a)) === 0 || (b = Math.abs(b)) === 0
			? 0
			: (a * b) / functions.gcd([a, b]);
	},
	bitwiseAnd: ([x, y]: any[]) => x & y,
	bitwiseOr: ([x, y]: any[]) => x | y,
	bitwiseXor: ([x, y]: any[]) => x ^ y,
	bitwiseNot: ([x]: any[]) => ~x,
} as const;
