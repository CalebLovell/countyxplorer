import stddev from "just-standard-deviation";
import { counties } from "~/data/counties";
import type { CountyData } from "~/data/types";

export const getCountyData = () => {
	return counties;
};

export const standardDeviation = () => {
	const population = counties.map((x) => x.population);
	const median_age = counties.map((x) => x.medianAge);
	const temperate = counties.map((x) => x.temperature.avgTempF);
	const homeValue = counties.map((x) => x.housing.medianHomeValue);
	const medianRent = counties.map((x) => x.rent.medianRent);

	const vals = {
		population_stdev: stddev(population) / 2,
		population_max: Math.max(...population),
		population_min: Math.min(...population),
		median_age_stdev: stddev(median_age) / 2,
		median_age_max: Math.max(...median_age),
		median_age_min: Math.min(...median_age),
		temperature_stdev: stddev(temperate) / 2,
		temperature_max: Math.max(...temperate),
		temperature_min: Math.min(...temperate),
		homeValue_stdev: stddev(homeValue) / 2,
		homeValue_max: Math.max(...homeValue),
		homeValue_min: Math.min(...homeValue),
		medianRent_stdev: stddev(medianRent) / 2,
		medianRent_max: Math.max(...medianRent),
		medianRent_min: Math.min(...medianRent),
	};
	return vals;
};

export const getActiveCounty = (county_id: number) => {
	const activeCounty = counties.find((x) => Number(x.id) === county_id);
	return activeCounty;
};

export const getColor = (
	county: CountyData,
	filterValues: {
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
	},
) => {
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

	const vals = standardDeviation();
	const {
		population_stdev,
		median_age_stdev,
		temperature_stdev,
		homeValue_stdev,
		medianRent_stdev,
	} = vals;

	let totalDeviations = 0;
	let totalImportance = 0;

	// Calculate weighted deviations for each active filter
	if (population) {
		const [minVal, maxVal] = population_val;
		const rangeCenter = (minVal + maxVal) / 2;
		const deviation =
			Math.abs(county.population - rangeCenter) / population_stdev;
		totalDeviations += deviation * population_importance;
		totalImportance += population_importance;
	}

	if (median_age) {
		const [minVal, maxVal] = median_age_val;
		const rangeCenter = (minVal + maxVal) / 2;
		const deviation =
			Math.abs(county.medianAge - rangeCenter) / median_age_stdev;
		totalDeviations += deviation * age_importance;
		totalImportance += age_importance;
	}

	if (temperature) {
		const [minVal, maxVal] = temperature_val;
		const rangeCenter = (minVal + maxVal) / 2;
		const deviation =
			Math.abs(county.temperature.avgTempF - rangeCenter) / temperature_stdev;
		totalDeviations += deviation * temperature_importance;
		totalImportance += temperature_importance;
	}

	if (home_value) {
		const [minVal, maxVal] = home_value_val;
		const rangeCenter = (minVal + maxVal) / 2;
		const deviation =
			Math.abs(county.housing.medianHomeValue - rangeCenter) / homeValue_stdev;
		totalDeviations += deviation * home_value_importance;
		totalImportance += home_value_importance;
	}

	if (median_rent) {
		const [minVal, maxVal] = median_rent_val;
		const rangeCenter = (minVal + maxVal) / 2;
		const deviation =
			Math.abs(county.rent.medianRent - rangeCenter) / medianRent_stdev;
		totalDeviations += deviation * median_rent_importance;
		totalImportance += median_rent_importance;
	}

	// If no filters are active, return default color
	if (totalImportance === 0) {
		return "#e5e7eb"; // Light gray for unfiltered counties
	}

	// Calculate average weighted deviation
	const avgDeviation = totalDeviations / totalImportance;

	// Convert average deviation to weight (0-9 scale) - using original thresholds
	let weight = 9;
	if (avgDeviation <= 0.5) weight = 1;
	else if (avgDeviation <= 1) weight = 2;
	else if (avgDeviation <= 1.5) weight = 3;
	else if (avgDeviation <= 2) weight = 4;
	else if (avgDeviation <= 2.5) weight = 5;
	else if (avgDeviation <= 3) weight = 6;
	else if (avgDeviation <= 3.5) weight = 7;
	else if (avgDeviation <= 4) weight = 8;
	// else weight = 9 (most different)

	const colors: Record<number, string> = {
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

	return colors[weight];
};
