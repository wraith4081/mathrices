export class UnitValue {
	value: number;
	units: Map<string, number>;

	constructor(value: number, unitStr: string) {
		this.value = value;
		this.units = this.parseUnit(unitStr);
	}

	parseUnit(unitStr: string): Map<string, number> {
		const units = new Map<string, number>();
		const parts = unitStr.split('/');
		const numerator = parts[0].split('*');
		const denominator = parts[1]?.split('*') || [];

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

		const unitStr = Array.from(newUnits.entries())
			.map(([unit, exp]) => (exp === 1 ? unit : `${unit}^${exp}`))
			.join('*');

		return new UnitValue(newValue, unitStr);
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

		const unitStr = Array.from(newUnits.entries())
			.map(([unit, exp]) => (exp === 1 ? unit : `${unit}^${exp}`))
			.join('*');

		return new UnitValue(newValue, unitStr);
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
		// Implement logic to convert this UnitValue to the target unit
		// This might involve defining conversion factors between units
		// Example: Convert km/h to m/s
		/* if (this.formatUnit() === 'km/h' && targetUnit === 'm/s') {
			const convertedValue = this.value * (1000 / 3600); // 1 km/h = 1000m / 3600s
			return new UnitValue(convertedValue, targetUnit);
		} */
		// Add more conversion rules as needed
		throw new Error(
			`Conversion from ${this.formatUnit()} to ${targetUnit} not implemented`
		);
	}
}
