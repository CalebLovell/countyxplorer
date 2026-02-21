import { create } from "zustand";
import { standardDeviation } from "~/data/functions";
import type { CountyData } from "~/data/types";

const {
	population_min,
	population_max,
	median_age_min,
	median_age_max,
	temperature_min,
	temperature_max,
	homeValue_min,
	homeValue_max,
	medianRent_min,
	medianRent_max,
} = standardDeviation();

type AppState = {
	sidebarIsOpen: boolean;
	setSidebarIsOpen: (by: boolean) => void;
	keyIsVisible: boolean;
	setKeyIsVisible: (by: boolean) => void;
	panelIsVisible: boolean;
	setPanelIsVisible: (by: boolean) => void;
	selectedCounty: CountyData | null;
	setSelectedCounty: (county: CountyData | null) => void;
	// Population Filter
	population: boolean;
	setPopulation: (value: boolean) => void;
	population_val: [number, number];
	setPopulationVal: (value: [number, number]) => void;
	population_importance: number;
	setPopulationImportance: (value: number) => void;
	// Median Age Filter
	age: boolean;
	setAge: (value: boolean) => void;
	age_val: [number, number];
	setAgeVal: (value: [number, number]) => void;
	age_importance: number;
	setAgeImportance: (value: number) => void;
	// Temperature Filter
	temperature: boolean;
	setTemperature: (value: boolean) => void;
	temperature_val: [number, number];
	setTemperatureVal: (value: [number, number]) => void;
	temperature_importance: number;
	setTemperatureImportance: (value: number) => void;
	// Home Value Filter
	home_value: boolean;
	setHomeValue: (value: boolean) => void;
	home_value_val: [number, number];
	setHomeValueVal: (value: [number, number]) => void;
	home_value_importance: number;
	setHomeValueImportance: (value: number) => void;
	// Median Rent Filter
	median_rent: boolean;
	setMedianRent: (value: boolean) => void;
	median_rent_val: [number, number];
	setMedianRentVal: (value: [number, number]) => void;
	median_rent_importance: number;
	setMedianRentImportance: (value: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
	sidebarIsOpen: false,
	setSidebarIsOpen: (by: boolean) => set({ sidebarIsOpen: by }),
	keyIsVisible: true,
	setKeyIsVisible: (by: boolean) => set({ keyIsVisible: by }),
	panelIsVisible: true,
	setPanelIsVisible: (by: boolean) => set({ panelIsVisible: by }),
	selectedCounty: null,
	setSelectedCounty: (county) => set({ selectedCounty: county }),
	// Population Filter
	population: true,
	setPopulation: (value: boolean) => set({ population: value }),
	population_val: [population_min, population_max],
	setPopulationVal: (value: [number, number]) => set({ population_val: value }),
	population_importance: 3,
	setPopulationImportance: (value: number) =>
		set({ population_importance: value }),
	// Median Age Filter
	age: true,
	setAge: (value: boolean) => set({ age: value }),
	age_val: [median_age_min, median_age_max],
	setAgeVal: (value: [number, number]) => set({ age_val: value }),
	age_importance: 3,
	setAgeImportance: (value: number) => set({ age_importance: value }),
	// Temperature Filter
	temperature: true,
	setTemperature: (value: boolean) => set({ temperature: value }),
	temperature_val: [temperature_min, temperature_max],
	setTemperatureVal: (value: [number, number]) =>
		set({ temperature_val: value }),
	temperature_importance: 3,
	setTemperatureImportance: (value: number) =>
		set({ temperature_importance: value }),
	// Home Value Filter
	home_value: true,
	setHomeValue: (value: boolean) => set({ home_value: value }),
	home_value_val: [homeValue_min, homeValue_max],
	setHomeValueVal: (value: [number, number]) => set({ home_value_val: value }),
	home_value_importance: 3,
	setHomeValueImportance: (value: number) =>
		set({ home_value_importance: value }),
	// Median Rent Filter
	median_rent: true,
	setMedianRent: (value: boolean) => set({ median_rent: value }),
	median_rent_val: [medianRent_min, medianRent_max],
	setMedianRentVal: (value: [number, number]) =>
		set({ median_rent_val: value }),
	median_rent_importance: 3,
	setMedianRentImportance: (value: number) =>
		set({ median_rent_importance: value }),
}));
