import { ResizedListenerOptions, CalculateValue, StyleFormatter } from '../index';

const PRECISION = 8;

const DEFAULT_MATRIX = [1, 0, 0, 1, 0, 0];
const TRANSLATEX = 4;
const TRANSLATEY = 5;

const ERR_UNSUPPORTED_FORMAT = new Error('Usupported matrix format');

/**
 * 
 * @param matrixArr 
 * @param options 
 */
function setMatrix(value: number[], scale: number, options?: ResizedListenerOptions) {
	const matrixArr = value.slice();

	let scaledTrX = matrixArr[TRANSLATEX] * scale;
	let scaledTrY = matrixArr[TRANSLATEY] * scale;

	function setMinMax(arr: number[], type: "max" | "min" = "max") {
		let boundX = arr[0];
		let boundY = arr[1];

		if(arr.length === 6) {
			boundX = arr[TRANSLATEX];
			boundY = arr[TRANSLATEY];
		}

		if(boundX && (type === "max" && scaledTrX > boundX) || (type === "min" && scaledTrX < boundX)) scaledTrX = boundX;
		if(boundY && (type === "max" && scaledTrY > boundY) || (type === "min" && scaledTrY < boundY)) scaledTrY = boundY;
	}

	if(options?.max && Array.isArray(options.max)) setMinMax(options.max, "max");
	if(options?.min && Array.isArray(options.min)) setMinMax(options.min, "min");

	matrixArr[TRANSLATEX] = parseFloat( scaledTrX.toFixed(PRECISION) );
	matrixArr[TRANSLATEY] = parseFloat( scaledTrY.toFixed(PRECISION) );

	return matrixArr;
}

/**
 * 
 * @param value 
 * @param scale 
 * @param options 
 */
function calculate(value: CalculateValue, scale: number, options?: ResizedListenerOptions) {
	if(!Array.isArray(value)) throw(ERR_UNSUPPORTED_FORMAT);

	for(const i in value) {
		if(typeof value[i] === "string") value[i] = parseFloat(value[i] as string);
	}

	let matrix: number[] = [];

	if(value.length === 2) {
		matrix = DEFAULT_MATRIX;
		
		matrix[TRANSLATEX] = value[0] as number;
		matrix[TRANSLATEY] = value[1] as number;

	} else if(value.length === 6) {
		matrix = value.slice() as number[];

	} else {
		throw(ERR_UNSUPPORTED_FORMAT);
	}

	matrix = setMatrix(matrix, scale, options);
	return `matrix(${matrix.join(", ")})`;
}

function generate(styleValue: string) {
	if(styleValue === "none") return false;

	const numberPattern = /-?\d+\.?\d*/g;
	const values: any = styleValue.match( numberPattern );
	if(!values) return false;

	for(const i in values) {
		const numericValue = parseFloat(values[i] as string);
		if(!isNaN(numericValue)) values[i] = numericValue;
	}

	return values;
}

const formatterMatrix: StyleFormatter = {
	id: "translate",
	style: "transform",
	calculate,
	generate
};

export default formatterMatrix;
