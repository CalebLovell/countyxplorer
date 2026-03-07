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

export const standardDeviation = (counties: CountyData[]) => {
	const population = counties.map((x) => x.population);
	const median_age = counties.map((x) => x.medianAge);
	const temperate = counties.map((x) => x.temperature.avgTempF);
	const homeValue = counties.map((x) => x.housing.medianHomeValue);
	const medianRent = counties.map((x) => x.rent.medianRent);
	const politics = counties.map((x) => x.votes.percentages.republican);

	return {
		population_stdev: stddev(population) / 2,
		population_max: Math.max(...population),
		population_min: Math.min(...population),
		population_quantiles: computeQuantileThresholds(population, 9),
		median_age_stdev: stddev(median_age) / 2,
		median_age_max: Math.max(...median_age),
		median_age_min: Math.min(...median_age),
		median_age_quantiles: computeQuantileThresholds(median_age, 9),
		temperature_stdev: stddev(temperate) / 2,
		temperature_max: Math.max(...temperate),
		temperature_min: Math.min(...temperate),
		temperature_quantiles: computeQuantileThresholds(temperate, 9),
		homeValue_stdev: stddev(homeValue) / 2,
		homeValue_max: Math.max(...homeValue),
		homeValue_min: Math.min(...homeValue),
		homeValue_quantiles: computeQuantileThresholds(homeValue, 9),
		medianRent_stdev: stddev(medianRent) / 2,
		medianRent_max: Math.max(...medianRent),
		medianRent_min: Math.min(...medianRent),
		medianRent_quantiles: computeQuantileThresholds(medianRent, 9),
		politics_stdev: stddev(politics) / 2,
		politics_max: Math.max(...politics),
		politics_min: Math.min(...politics),
		politics_quantiles: computeQuantileThresholds(politics, 9),
	};
};

export const getActiveCounty = (county_id: number, counties: CountyData[]) => {
	return counties.find((x) => Number(x.id) === county_id);
};

export const colors: Record<number, string> = {
	1: "#173B53",
	2: "#205274",
	3: "rgb(50,128,181)",
	4: "rgb(73,183,194)",
	5: "rgb(133,204,187)",
	6: "rgb(202,233,181)",
	7: "rgb(254,255,207)",
	8: "#FEFFE0",
	9: "#ffffff",
};

export const getColor = (
	county: CountyData,
	filterValues: {
		population: boolean;
		population_val: [number, number];
		population_pref: number;
		population_importance: number;
		median_age: boolean;
		median_age_val: [number, number];
		median_age_pref: number;
		age_importance: number;
		temperature: boolean;
		temperature_val: [number, number];
		temperature_pref: number;
		temperature_importance: number;
		home_value: boolean;
		home_value_val: [number, number];
		home_value_pref: number;
		home_value_importance: number;
		median_rent: boolean;
		median_rent_val: [number, number];
		median_rent_pref: number;
		median_rent_importance: number;
		politics: boolean;
		politics_val: [number, number];
		politics_pref: number;
		politics_importance: number;
	},
	stdev: Stdev,
) => {
	const {
		population,
		population_pref,
		population_importance,
		median_age,
		median_age_pref,
		age_importance,
		temperature,
		temperature_pref,
		temperature_importance,
		home_value,
		home_value_pref,
		home_value_importance,
		median_rent,
		median_rent_pref,
		median_rent_importance,
		politics,
		politics_pref,
		politics_importance,
	} = filterValues;

	const {
		population_stdev,
		median_age_stdev,
		temperature_stdev,
		homeValue_stdev,
		medianRent_stdev,
		politics_stdev,
	} = stdev;

	let totalDeviations = 0;
	let totalImportance = 0;

	if (population) {
		const deviation =
			Math.abs(county.population - population_pref) / population_stdev;
		totalDeviations += deviation * population_importance;
		totalImportance += population_importance;
	}

	if (median_age) {
		const deviation =
			Math.abs(county.medianAge - median_age_pref) / median_age_stdev;
		totalDeviations += deviation * age_importance;
		totalImportance += age_importance;
	}

	if (temperature) {
		const deviation =
			Math.abs(county.temperature.avgTempF - temperature_pref) /
			temperature_stdev;
		totalDeviations += deviation * temperature_importance;
		totalImportance += temperature_importance;
	}

	if (home_value) {
		const deviation =
			Math.abs(county.housing.medianHomeValue - home_value_pref) /
			homeValue_stdev;
		totalDeviations += deviation * home_value_importance;
		totalImportance += home_value_importance;
	}

	if (median_rent) {
		const deviation =
			Math.abs(county.rent.medianRent - median_rent_pref) / medianRent_stdev;
		totalDeviations += deviation * median_rent_importance;
		totalImportance += median_rent_importance;
	}

	if (politics) {
		const deviation =
			Math.abs(county.votes.percentages.republican - politics_pref) /
			politics_stdev;
		totalDeviations += deviation * politics_importance;
		totalImportance += politics_importance;
	}

	if (totalImportance === 0) {
		return "#e5e7eb";
	}

	const avgDeviation = totalDeviations / totalImportance;

	let weight = 9;
	if (avgDeviation <= 0.5) weight = 1;
	else if (avgDeviation <= 1) weight = 2;
	else if (avgDeviation <= 1.5) weight = 3;
	else if (avgDeviation <= 2) weight = 4;
	else if (avgDeviation <= 2.5) weight = 5;
	else if (avgDeviation <= 3) weight = 6;
	else if (avgDeviation <= 3.5) weight = 7;
	else if (avgDeviation <= 4) weight = 8;

	return colors[weight];
};

export type LayerKey =
	| "population"
	| "age"
	| "temperature"
	| "home_value"
	| "median_rent"
	| "politics";

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
	// Politics: blue → white → red (RdBu), most Dem → most Rep
	politics: [
		"#053061",
		"#2166ac",
		"#4393c3",
		"#92c5de",
		"#f7f7f7",
		"#f4a582",
		"#d6604d",
		"#b2182b",
		"#67001f",
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
		case "politics":
			value = county.votes.percentages.republican;
			thresholds = stdev.politics_quantiles;
			break;
	}

	// bucket: 0 = lowest value, 8 = highest value
	let bucket = 0;
	for (const t of thresholds) {
		if (value > t) bucket++;
	}
	return layerColors[layer][bucket];
};
