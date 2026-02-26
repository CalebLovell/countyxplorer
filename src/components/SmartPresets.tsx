import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { searchDefaults } from "~/routes/$layer";

const route = getRouteApi("/$layer");

type Preset = {
	label: string;
	emoji: string;
	description: string;
	values: Partial<typeof searchDefaults>;
};

const presets: Preset[] = [
	{
		label: "Retirement Paradise",
		emoji: "🏖️",
		description: "Warm, affordable, peaceful",
		values: {
			population: true,
			population_importance: 2,
			age: true,
			age_importance: 2,
			temperature: true,
			temperature_importance: 5,
			home_value: true,
			home_value_importance: 4,
			median_rent: true,
			median_rent_importance: 4,
			temperature_min: 58,
			temperature_max: 75,
			population_min: 5000,
			population_max: 200000,
			home_value_min: 45200,
			home_value_max: 250000,
			rent_min: 400,
			rent_max: 900,
		},
	},
	{
		label: "Family Friendly",
		emoji: "👨‍👩‍👧‍👦",
		description: "Affordable, mid-size, moderate climate",
		values: {
			population: true,
			population_importance: 3,
			age: true,
			age_importance: 3,
			temperature: true,
			temperature_importance: 2,
			home_value: true,
			home_value_importance: 5,
			median_rent: true,
			median_rent_importance: 5,
			population_min: 20000,
			population_max: 500000,
			age_min: 30,
			age_max: 42,
			home_value_min: 100000,
			home_value_max: 350000,
			rent_min: 500,
			rent_max: 1200,
		},
	},
	{
		label: "Young Professional",
		emoji: "💼",
		description: "Urban, vibrant, career-oriented",
		values: {
			population: true,
			population_importance: 5,
			age: true,
			age_importance: 4,
			temperature: true,
			temperature_importance: 1,
			home_value: true,
			home_value_importance: 2,
			median_rent: true,
			median_rent_importance: 3,
			population_min: 100000,
			population_max: 9848406,
			age_min: 25,
			age_max: 38,
		},
	},
	{
		label: "Rural Escape",
		emoji: "🏔️",
		description: "Small town, low cost, nature",
		values: {
			population: true,
			population_importance: 5,
			age: true,
			age_importance: 1,
			temperature: true,
			temperature_importance: 1,
			home_value: true,
			home_value_importance: 4,
			median_rent: true,
			median_rent_importance: 4,
			population_min: 43,
			population_max: 15000,
			home_value_min: 45200,
			home_value_max: 200000,
			rent_min: 400,
			rent_max: 800,
		},
	},
];

export const SmartPresets = () => {
	const search = route.useSearch();
	const navigate = useNavigate();

	const applyPreset = (preset: Preset) => {
		navigate({
			to: "/$layer",
			params: { layer: "combined" },
			search: {
				...search,
				...preset.values,
			} as typeof search,
		});
	};

	return (
		<section className="w-full">
			<div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3">
				<h3 className="mb-2 font-semibold text-gray-900 text-sm">
					🎯 Quick Presets
				</h3>
				<div className="grid grid-cols-2 gap-1.5">
					{presets.map((preset) => (
						<button
							key={preset.label}
							type="button"
							onClick={() => applyPreset(preset)}
							className="rounded-md border border-amber-200 bg-white px-2 py-2 text-left transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-sm"
						>
							<div className="font-medium text-xs">
								{preset.emoji} {preset.label}
							</div>
							<div
								className="text-gray-500"
								style={{ fontSize: "10px" }}
							>
								{preset.description}
							</div>
						</button>
					))}
				</div>
			</div>
		</section>
	);
};
