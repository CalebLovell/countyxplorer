import { create } from "zustand";
import type { Stdev } from "~/data/functions";

type AppState = {
	initialized: boolean;
	initRanges: (stdev: Stdev) => void;
	population_val: [number, number];
	setPopulationVal: (value: [number, number]) => void;
	age_val: [number, number];
	setAgeVal: (value: [number, number]) => void;
	temperature_val: [number, number];
	setTemperatureVal: (value: [number, number]) => void;
	home_value_val: [number, number];
	setHomeValueVal: (value: [number, number]) => void;
	median_rent_val: [number, number];
	setMedianRentVal: (value: [number, number]) => void;
};

export const useAppStore = create<AppState>((set) => ({
	initialized: false,
	initRanges: (stdev) =>
		set({
			initialized: true,
			population_val: [stdev.population_min, stdev.population_max],
			age_val: [stdev.median_age_min, stdev.median_age_max],
			temperature_val: [stdev.temperature_min, stdev.temperature_max],
			home_value_val: [stdev.homeValue_min, stdev.homeValue_max],
			median_rent_val: [stdev.medianRent_min, stdev.medianRent_max],
		}),
	population_val: [0, 0],
	setPopulationVal: (value) => set({ population_val: value }),
	age_val: [0, 0],
	setAgeVal: (value) => set({ age_val: value }),
	temperature_val: [0, 0],
	setTemperatureVal: (value) => set({ temperature_val: value }),
	home_value_val: [0, 0],
	setHomeValueVal: (value) => set({ home_value_val: value }),
	median_rent_val: [0, 0],
	setMedianRentVal: (value) => set({ median_rent_val: value }),
}));
