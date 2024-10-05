export class UnitValue {
	value: number;
	unit: string;

	constructor(value: number, unit: string) {
		this.value = value;
		this.unit = unit;
	}

	multiply(other: UnitValue): UnitValue {
		const combinedUnitMap = this.combineUnitMaps(
			this.parseUnit(this.unit),
			this.parseUnit(other.unit),
			'+'
		);
		const combinedUnitString = this.formatUnit(combinedUnitMap);
		return new UnitValue(this.value * other.value, combinedUnitString);
	}

	divide(other: UnitValue): UnitValue {
		const combinedUnitMap = this.combineUnitMaps(
			this.parseUnit(this.unit),
			this.parseUnit(other.unit),
			'-'
		);
		const combinedUnitString = this.formatUnit(combinedUnitMap);
		return new UnitValue(this.value / other.value, combinedUnitString);
	}

	parseUnit(unitStr: string): { [unit: string]: number } {
		const unitMap: { [unit: string]: number } = {};
		if (!unitStr) return unitMap;

		const tokens = unitStr.split(/(?=[*/])/);
		let currentOperator = '*';

		for (const token of tokens) {
			if (token === '*' || token === '/') {
				currentOperator = token;
				continue;
			}

			const match = token.match(/^([a-zA-Z]+)(\^(-?\d+))?$/);
			if (match) {
				const unit = match[1];
				const exponent = match[3] ? parseInt(match[3]) : 1;

				unitMap[unit] =
					(unitMap[unit] || 0) +
					(currentOperator === '*' ? exponent : -exponent);
			} else {
				throw new Error(`Invalid unit format: '${token}'`);
			}
		}

		return unitMap;
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

	formatUnit(unitMap: { [unit: string]: number }): string {
		const positiveUnits = [];
		const negativeUnits = [];

		for (const unit in unitMap) {
			const exponent = unitMap[unit];
			if (exponent > 0) {
				positiveUnits.push(
					exponent === 1 ? `${unit}` : `${unit}^${exponent}`
				);
			} else if (exponent < 0) {
				negativeUnits.push(
					exponent === -1 ? `${unit}` : `${unit}^${-exponent}`
				);
			}
		}

		let unitString = '';

		unitString += positiveUnits.length > 0 ? positiveUnits.join('*') : '1';

		if (negativeUnits.length > 0) {
			unitString += '/';
			unitString += negativeUnits.join('*');
		}

		return unitString;
	}
}
