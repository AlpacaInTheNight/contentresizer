import { ResizedListenerOptions, CalculateValue, StyleFormatter } from '../index';

const resizableStyles: string[] = [
	"width",
	"height",
	"fontSize",
	"padding",
	"margin",
	"border",
	"outline",
	"webkitTextStroke",
	/* "backgroundSize",
	"backgroundPosition" */
];

const PRECISION = 8;

function calculate(value: CalculateValue, scale: number, options?: ResizedListenerOptions) {
	if(Array.isArray(value)) {
		const max = options?.max && Array.isArray(options.max) ? options.max : undefined;
		const min = options?.min && Array.isArray(options.min) ? options.min : undefined;

		const cloneArr = value.slice();
		for(const i in cloneArr) {
			if(typeof cloneArr[i] === "number") {
				let scaled = <number> cloneArr[i] * scale;
				if(max && max[i] && scaled > max[i]) scaled = max[i];
				if(min && min[i] && scaled < min[i]) scaled = min[i];

				cloneArr[i] = parseFloat( scaled.toFixed(PRECISION) ) + "px";
			}
		}

		return cloneArr.join(" ");
	}

	if(typeof value === "number") {
		let scaled = value * scale;

		if(options?.max) {
			if(typeof options.max === "number" && scaled > options.max) scaled = options.max;
			if(Array.isArray(options.max) && scaled > options.max[0]) scaled = options.max[0];
		}

		if(options?.min) {
			if(typeof options.min === "number" && scaled < options.min) scaled = options.min;
			if(Array.isArray(options.min) && scaled < options.min[0]) scaled = options.min[0];
		}

		return parseFloat( scaled.toFixed(PRECISION) ) + "px";
	}
	return value;
}

function generate(styleValue: string) {
	const valuesArr: (string | number)[] = styleValue.split(" ");

	for(const i in valuesArr) {
		const numericValue = parseFloat(valuesArr[i] as string);
		if(!isNaN(numericValue)) valuesArr[i] = numericValue;
	}

	return valuesArr.length > 1 ? valuesArr : valuesArr[0];
}

const formatter: StyleFormatter = {
	id: "general",
	isDefault: true,
	style: resizableStyles,
	calculate,
	generate
};

export default formatter;
