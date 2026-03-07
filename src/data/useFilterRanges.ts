import { getRouteApi } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";

const route = getRouteApi("/$layer");

export const useFilterRanges = () => {
	const { stdev } = useCounties();
	const search = route.useSearch();

	const population_val = [
		search.population_min ?? stdev.population_min,
		search.population_max ?? stdev.population_max,
	] as [number, number];
	const age_val = [
		search.age_min ?? stdev.median_age_min,
		search.age_max ?? stdev.median_age_max,
	] as [number, number];
	const temperature_val = [
		search.temperature_min ?? stdev.temperature_min,
		search.temperature_max ?? stdev.temperature_max,
	] as [number, number];
	const home_value_val = [
		search.home_value_min ?? stdev.homeValue_min,
		search.home_value_max ?? stdev.homeValue_max,
	] as [number, number];
	const median_rent_val = [
		search.rent_min ?? stdev.medianRent_min,
		search.rent_max ?? stdev.medianRent_max,
	] as [number, number];
	const politics_val = [
		search.politics_min ?? stdev.politics_min,
		search.politics_max ?? stdev.politics_max,
	] as [number, number];

	return {
		population_val,
		age_val,
		temperature_val,
		home_value_val,
		median_rent_val,
		politics_val,
		population_pref:
			search.population_pref ?? (population_val[0] + population_val[1]) / 2,
		age_pref: search.age_pref ?? (age_val[0] + age_val[1]) / 2,
		temperature_pref:
			search.temperature_pref ?? (temperature_val[0] + temperature_val[1]) / 2,
		home_value_pref:
			search.home_value_pref ?? (home_value_val[0] + home_value_val[1]) / 2,
		median_rent_pref:
			search.rent_pref ?? (median_rent_val[0] + median_rent_val[1]) / 2,
		politics_pref:
			search.politics_pref ?? (politics_val[0] + politics_val[1]) / 2,
	};
};
