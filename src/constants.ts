import { ComplexNumber } from './utils/complexNumber';

export const constants: { [key: string]: any } = {
	pi: Math.PI,
	e: Math.E,
	i: new ComplexNumber(0, 1),
	true: true,
	false: false,
};
