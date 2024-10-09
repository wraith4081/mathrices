type ConversionFactor = {
	[baseUnit: string]: number; // factor to convert to base unit
};

export const unitRegistry: { [unit: string]: ConversionFactor } = {
	// Length
	m: { m: 1 },
	km: { m: 1000 },
	cm: { m: 0.01 },
	mm: { m: 0.001 },
	mi: { m: 1609.34 },

	// Time
	s: { s: 1 },
	min: { s: 60 },
	h: { s: 3600 },
	// Mass
	g: { g: 1 },
	kg: { g: 1000 },
	mg: { g: 0.001 },

	// Volume
	m3: { m3: 1 },
	l: { m3: 0.001 }, // 1 liter = 0.001 cubic meters
	ml: { m3: 0.000001 },

	// Add more units as needed
};
export class UnitValue {
	value: number;
	units: Map<string, number>;

	constructor(value: number, unitStr: string) {
		this.value = value;
		this.units = this.parseUnit(unitStr);
		this.simplifyUnits();
	}

	parseUnit(unitStr: string): Map<string, number> {
		const units = new Map<string, number>();
		if (!unitStr) return units; // No units
		const parts = unitStr.split('/');
		const numerator = parts[0].split('*').filter((u) => u);
		const denominator = parts[1]?.split('*').filter((u) => u) || [];

		numerator.forEach((unit) => {
			units.set(unit, (units.get(unit) || 0) + 1);
		});

		denominator.forEach((unit) => {
			units.set(unit, (units.get(unit) || 0) - 1);
		});

		return units;
	}

	formatUnit(): string {
		const numerator: string[] = [];
		const denominator: string[] = [];
		this.units.forEach((exp, unit) => {
			if (exp > 0) {
				numerator.push(exp === 1 ? unit : `${unit}^${exp}`);
			} else if (exp < 0) {
				denominator.push(exp === -1 ? unit : `${unit}^${-exp}`);
			}
		});
		const num = numerator.join('*') || '1';
		const den = denominator.join('*');
		return den ? `${num}/${den}` : num;
	}

	multiply(other: UnitValue): UnitValue {
		const newValue = this.value * other.value;
		const newUnits = new Map(this.units);

		other.units.forEach((exp, unit) => {
			newUnits.set(unit, (newUnits.get(unit) || 0) + exp);
			if (newUnits.get(unit) === 0) {
				newUnits.delete(unit);
			}
		});

		const unitStr = UnitValue.formatUnitFromMap(newUnits);

		const result = new UnitValue(newValue, unitStr);
		result.simplifyUnits();
		return result;
	}

	divide(other: UnitValue): UnitValue {
		const newValue = this.value / other.value;
		const newUnits = new Map(this.units);

		other.units.forEach((exp, unit) => {
			newUnits.set(unit, (newUnits.get(unit) || 0) - exp);
			if (newUnits.get(unit) === 0) {
				newUnits.delete(unit);
			}
		});

		const unitStr = UnitValue.formatUnitFromMap(newUnits);

		const result = new UnitValue(newValue, unitStr);
		result.simplifyUnits();
		return result;
	}

	combineUnitMaps(
		map1: { [unit: string]: number },
		map2: { [unit: string]: number },
		operation: '+' | '-'
	): { [unit: string]: number } {
		const resultMap = { ...map1 };

		for (const unit in map2) {
			resultMap[unit] =
				(resultMap[unit] || 0) +
				(operation === '+' ? map2[unit] : -map2[unit]);
		}

		for (const unit in resultMap) {
			if (resultMap[unit] === 0) {
				delete resultMap[unit];
			}
		}

		return resultMap;
	}

	get unit() {
		return this.formatUnit();
	}

	convertTo(targetUnit: string): UnitValue {
		return UnitValue.convertUnits(this, targetUnit);
	}

	private static unitRegistry: { [unit: string]: ConversionFactor } =
		unitRegistry;

	static areUnitsCompatible(
		units1: Map<string, number>,
		units2: Map<string, number>
	): boolean {
		const simplified1 = UnitValue.simplifyUnits(units1).units;
		const simplified2 = UnitValue.simplifyUnits(units2).units;
		if (simplified1.size !== simplified2.size) return false;
		for (let [unit, exp] of simplified1) {
			if (simplified2.get(unit) !== exp) return false;
		}
		return true;
	}

	static simplifyUnits(units: Map<string, number>): {
		units: Map<string, number>;
		factor: number;
	} {
		let factor = 1;
		const simplified = new Map<string, number>();
		units.forEach((exp, unit) => {
			const conversion = UnitValue.unitRegistry[unit];
			if (!conversion) {
				throw new Error(
					`Unit '${unit}' is not defined in the registry.`
				);
			}
			for (const [baseUnit, baseFactor] of Object.entries(conversion)) {
				simplified.set(baseUnit, (simplified.get(baseUnit) || 0) + exp);
				factor *= Math.pow(baseFactor, exp);
			}
		});

		for (const [unit, exp] of simplified.entries()) {
			if (exp === 0) {
				simplified.delete(unit);
			}
		}
		return { units: simplified, factor };
	}

	private static computeConversionFactor(
		source: UnitValue,
		targetUnitStr: string
	): number {
		const sourceSimplified = UnitValue.simplifyUnits(source.units);
		const targetSimplified = UnitValue.simplifyUnits(
			new UnitValue(1, targetUnitStr).units
		);

		if (
			!UnitValue.areUnitsCompatible(source.units, targetSimplified.units)
		) {
			throw new Error(
				`Incompatible units: cannot convert from ${source.formatUnit()} to ${targetUnitStr}`
			);
		}

		let factor = 1;

		sourceSimplified.units.forEach((exp, unit) => {
			const sourceConversion = UnitValue.unitRegistry[unit];
			const targetConversion = UnitValue.unitRegistry[targetUnitStr];

			const targetFactorEntry = Object.entries(targetConversion).find(
				([u, _]) => u === unit
			);
			const targetFactor = targetFactorEntry ? targetFactorEntry[1] : 1;
			const sourceFactor = sourceConversion ? sourceConversion[unit] : 1;
			factor *= Math.pow(sourceFactor / targetFactor, exp);
		});

		return factor;
	}

	static convertUnits(source: UnitValue, targetUnitStr: string): UnitValue {
		const conversionFactor = UnitValue.computeConversionFactor(
			source,
			targetUnitStr
		);
		const newValue = source.value * conversionFactor;
		return new UnitValue(newValue, targetUnitStr);
	}

	simplifyUnits(): void {
		const { units: simplified, factor } = UnitValue.simplifyUnits(
			this.units
		);
		this.value *= factor;
		this.units = simplified;

		for (const [unit, exp] of this.units.entries()) {
			if (exp === 0) {
				this.units.delete(unit);
			}
		}
	}

	static formatUnitFromMap(units: Map<string, number>): string {
		const numerator: string[] = [];
		const denominator: string[] = [];
		units.forEach((exp, unit) => {
			if (exp > 0) {
				numerator.push(exp === 1 ? unit : `${unit}^${exp}`);
			} else if (exp < 0) {
				denominator.push(exp === -1 ? unit : `${unit}^${-exp}`);
			}
		});
		const num = numerator.join('*') || '1';
		const den = denominator.join('*');
		return den ? `${num}/${den}` : num;
	}
}
