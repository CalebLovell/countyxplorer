import stddev from "just-standard-deviation";
import type { CountyData } from "~/data/types";

export type Stdev = ReturnType<typeof standardDeviation>;

const computeQuantileThresholds = (
	values: number[],
	numBuckets: number,
): number[] => {
	const sorted = [...values].sort((a, b) => a - b);
	const thresholds: number[] = [];
	for (let i = 1; i < numBuckets; i++) {
		const idx = (i / numBuckets) * (sorted.length - 1);
		const lower = Math.floor(idx);
		const upper = Math.ceil(idx);
		const frac = idx - lower;
		thresholds.push(sorted[lower] * (1 - frac) + sorted[upper] * frac);
	}
	return thresholds;
};

const safeMax = (arr: number[]): number => {
	let max = -Infinity;
	for (const v of arr) if (v > max) max = v;
	return max;
};

const safeMin = (arr: number[]): number => {
	let min = Infinity;
	for (const v of arr) if (v < min) min = v;
	return min;
};

export const standardDeviation = (counties: CountyData[]) => {
	const population = counties.map((x) => x.population);
	const median_age = counties.map((x) => x.medianAge);
	const temperate = counties.map((x) => x.temperature.avgTempF);
	const homeValue = counties.map((x) => x.housing.medianHomeValue);
	const medianRent = counties.map((x) => x.rent.medianRent);

	return {
		population_stdev: stddev(population) / 2,
		population_max: safeMax(population),
		population_min: safeMin(population),
		population_quantiles: computeQuantileThresholds(population, 9),
		median_age_stdev: stddev(median_age) / 2,
		median_age_max: safeMax(median_age),
		median_age_min: safeMin(median_age),
		median_age_quantiles: computeQuantileThresholds(median_age, 9),
		temperature_stdev: stddev(temperate) / 2,
		temperature_max: safeMax(temperate),
		temperature_min: safeMin(temperate),
		temperature_quantiles: computeQuantileThresholds(temperate, 9),
		homeValue_stdev: stddev(homeValue) / 2,
		homeValue_max: safeMax(homeValue),
		homeValue_min: safeMin(homeValue),
		homeValue_quantiles: computeQuantileThresholds(homeValue, 9),
		medianRent_stdev: stddev(medianRent) / 2,
		medianRent_max: safeMax(medianRent),
		medianRent_min: safeMin(medianRent),
		medianRent_quantiles: computeQuantileThresholds(medianRent, 9),
	};
};

export const getActiveCounty = (county_id: number, counties: CountyData[]) => {
	return counties.find((x) => Number(x.id) === county_id);
};

export const colors: Record<number, string> = {
	1: "#173B53",
	2: "#205274",
	3: "#3280B5",
	4: "#49B7C2",
	5: "#85CCBB",
	6: "#CAE9B5",
	7: "#FEFFCF",
	8: "#FEFFE0",
	9: "#ffffff",
};

export type FilterValues = {
	population: boolean;
	population_val: [number, number];
	population_importance: number;
	median_age: boolean;
	median_age_val: [number, number];
	age_importance: number;
	temperature: boolean;
	temperature_val: [number, number];
	temperature_importance: number;
	home_value: boolean;
	home_value_val: [number, number];
	home_value_importance: number;
	median_rent: boolean;
	median_rent_val: [number, number];
	median_rent_importance: number;
};

/** Returns a numeric deviation score (lower = better match). -1 if no filters active. */
export const getScore = (
	county: CountyData,
	filterValues: FilterValues,
	stdev: Stdev,
): number => {
	const {
		population,
		population_val,
		population_importance,
		median_age,
		median_age_val,
		age_importance,
		temperature,
		temperature_val,
		temperature_importance,
		home_value,
		home_value_val,
		home_value_importance,
		median_rent,
		median_rent_val,
		median_rent_importance,
	} = filterValues;

	const {
		population_stdev,
		median_age_stdev,
		temperature_stdev,
		homeValue_stdev,
		medianRent_stdev,
	} = stdev;

	let totalDeviations = 0;
	let totalImportance = 0;

	// Hybrid scoring: counties inside the range get a small score based on
	// distance from center (0 at center, up to 0.3 at edges). Counties outside
	// the range get a larger penalty starting at 0.3 and growing with distance.
	const rangeDeviation = (value: number, min: number, max: number, stdevVal: number) => {
		const rangeSize = max - min;
		if (rangeSize === 0) return Math.abs(value - min) / stdevVal;
		const center = (min + max) / 2;
		const halfRange = rangeSize / 2;
		if (value >= min && value <= max) {
			// Inside range: small gradient (0 at center → 0.3 at edges)
			return (Math.abs(value - center) / halfRange) * 0.3;
		}
		// Outside range: penalty starting at 0.3 + distance beyond edge
		const overshoot = value < min ? min - value : value - max;
		return 0.3 + overshoot / stdevVal;
	};

	if (population) {
		const [minVal, maxVal] = population_val;
		// Skip if range covers full extent (user hasn't narrowed it)
		if (minVal !== stdev.population_min || maxVal !== stdev.population_max) {
			const deviation = rangeDeviation(county.population, minVal, maxVal, population_stdev);
			totalDeviations += deviation * population_importance;
			totalImportance += population_importance;
		}
	}

	if (median_age) {
		const [minVal, maxVal] = median_age_val;
		if (minVal !== stdev.median_age_min || maxVal !== stdev.median_age_max) {
			const deviation = rangeDeviation(county.medianAge, minVal, maxVal, median_age_stdev);
			totalDeviations += deviation * age_importance;
			totalImportance += age_importance;
		}
	}

	if (temperature) {
		const [minVal, maxVal] = temperature_val;
		if (minVal !== stdev.temperature_min || maxVal !== stdev.temperature_max) {
			const deviation = rangeDeviation(county.temperature.avgTempF, minVal, maxVal, temperature_stdev);
			totalDeviations += deviation * temperature_importance;
			totalImportance += temperature_importance;
		}
	}

	if (home_value) {
		const [minVal, maxVal] = home_value_val;
		if (minVal !== stdev.homeValue_min || maxVal !== stdev.homeValue_max) {
			const deviation = rangeDeviation(county.housing.medianHomeValue, minVal, maxVal, homeValue_stdev);
			totalDeviations += deviation * home_value_importance;
			totalImportance += home_value_importance;
		}
	}

	if (median_rent) {
		const [minVal, maxVal] = median_rent_val;
		if (minVal !== stdev.medianRent_min || maxVal !== stdev.medianRent_max) {
			const deviation = rangeDeviation(county.rent.medianRent, minVal, maxVal, medianRent_stdev);
			totalDeviations += deviation * median_rent_importance;
			totalImportance += median_rent_importance;
		}
	}

	if (totalImportance === 0) return -1;
	return totalDeviations / totalImportance;
};

export const getColor = (
	county: CountyData,
	filterValues: FilterValues,
	stdev: Stdev,
) => {
	const score = getScore(county, filterValues, stdev);
	if (score < 0) return "#e5e7eb";

	let weight = 9;
	if (score <= 0.5) weight = 1;
	else if (score <= 1) weight = 2;
	else if (score <= 1.5) weight = 3;
	else if (score <= 2) weight = 4;
	else if (score <= 2.5) weight = 5;
	else if (score <= 3) weight = 6;
	else if (score <= 3.5) weight = 7;
	else if (score <= 4) weight = 8;

	return colors[weight];
};

/** Cost of living composite: weighted combo of rent + home value percentiles (0-100, lower = cheaper) */
export const getCostOfLiving = (county: CountyData, stdev: Stdev): number => {
	const rentRange = stdev.medianRent_max - stdev.medianRent_min;
	const homeRange = stdev.homeValue_max - stdev.homeValue_min;
	if (rentRange === 0 || homeRange === 0) return 50;
	const rentPct =
		((county.rent.medianRent - stdev.medianRent_min) / rentRange) * 100;
	const homePct =
		((county.housing.medianHomeValue - stdev.homeValue_min) / homeRange) * 100;
	return Math.round(rentPct * 0.6 + homePct * 0.4);
};

export type LayerKey =
	| "population"
	| "age"
	| "temperature"
	| "home_value"
	| "median_rent";

// Per-layer color palettes (9 colors, low→high value)
export const layerColors: Record<LayerKey, string[]> = {
	// Population: yellow → red (YlOrRd)
	population: [
		"#ffffcc",
		"#ffeda0",
		"#fed976",
		"#feb24c",
		"#fd8d3c",
		"#fc4e2a",
		"#e31a1c",
		"#bd0026",
		"#800026",
	],
	// Age: light lavender → dark purple (BuPu), young → old
	age: [
		"#f7fcfd",
		"#e0ecf4",
		"#bfd3e6",
		"#9ebcda",
		"#8c96c6",
		"#8c6bb1",
		"#88419d",
		"#810f7c",
		"#4d004b",
	],
	// Temperature: blue → red (RdBu reversed), cold → hot
	temperature: [
		"#2166ac",
		"#4393c3",
		"#74add1",
		"#abd9e9",
		"#ffffbf",
		"#fee090",
		"#fdae61",
		"#f46d43",
		"#d73027",
	],
	// Home value: light → dark green (Greens), low → high
	home_value: [
		"#f7fcf5",
		"#e5f5e0",
		"#c7e9c0",
		"#a1d99b",
		"#74c476",
		"#41ab5d",
		"#238b45",
		"#006d2c",
		"#00441b",
	],
	// Median rent: light → dark orange (Oranges), low → high
	median_rent: [
		"#fff5eb",
		"#fee6ce",
		"#fdd0a2",
		"#fdae6b",
		"#fd8d3c",
		"#f16913",
		"#d94801",
		"#a63603",
		"#7f2704",
	],
};

export const getLayerColor = (
	county: CountyData,
	layer: LayerKey,
	stdev: Stdev,
): string => {
	let value: number;
	let thresholds: number[];

	switch (layer) {
		case "population":
			value = county.population;
			thresholds = stdev.population_quantiles;
			break;
		case "age":
			value = county.medianAge;
			thresholds = stdev.median_age_quantiles;
			break;
		case "temperature":
			value = county.temperature.avgTempF;
			thresholds = stdev.temperature_quantiles;
			break;
		case "home_value":
			value = county.housing.medianHomeValue;
			thresholds = stdev.homeValue_quantiles;
			break;
		case "median_rent":
			value = county.rent.medianRent;
			thresholds = stdev.medianRent_quantiles;
			break;
	}

	// bucket: 0 = lowest value, 8 = highest value
	let bucket = 0;
	for (const t of thresholds) {
		if (value > t) bucket++;
	}
	return layerColors[layer][bucket];
};
