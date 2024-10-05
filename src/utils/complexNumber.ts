export class ComplexNumber {
	real: number;
	imag: number;

	constructor(real: number, imag: number) {
		this.real = real;
		this.imag = imag;
	}

	add(other: ComplexNumber): ComplexNumber {
		return new ComplexNumber(
			this.real + other.real,
			this.imag + other.imag
		);
	}

	subtract(other: ComplexNumber): ComplexNumber {
		return new ComplexNumber(
			this.real - other.real,
			this.imag - other.imag
		);
	}

	multiply(other: ComplexNumber): ComplexNumber {
		return new ComplexNumber(
			this.real * other.real - this.imag * other.imag,
			this.real * other.imag + this.imag * other.real
		);
	}

	divide(other: ComplexNumber): ComplexNumber {
		const denom = other.real ** 2 + other.imag ** 2;
		return new ComplexNumber(
			(this.real * other.real + this.imag * other.imag) / denom,
			(this.imag * other.real - this.real * other.imag) / denom
		);
	}

	magnitude(): number {
		return Math.sqrt(this.real ** 2 + this.imag ** 2);
	}
}
