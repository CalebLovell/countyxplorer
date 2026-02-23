import { getRouteApi } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";

const route = getRouteApi("/$layer");

export const useFilterRanges = () => {
	const { stdev } = useCounties();
	const search = route.useSearch();

	return {
		population_val: [
			search.population_min ?? stdev.population_min,
			search.population_max ?? stdev.population_max,
		] as [number, number],
		age_val: [
			search.age_min ?? stdev.median_age_min,
			search.age_max ?? stdev.median_age_max,
		] as [number, number],
		temperature_val: [
			search.temperature_min ?? stdev.temperature_min,
			search.temperature_max ?? stdev.temperature_max,
		] as [number, number],
		home_value_val: [
			search.home_value_min ?? stdev.homeValue_min,
			search.home_value_max ?? stdev.homeValue_max,
		] as [number, number],
		median_rent_val: [
			search.rent_min ?? stdev.medianRent_min,
			search.rent_max ?? stdev.medianRent_max,
		] as [number, number],
	};
};
