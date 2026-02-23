import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useCounties } from "~/data/CountiesContext";

const route = getRouteApi("/$layer");

const arrayMedian = (arr: number[]): number => {
	const sorted = [...arr].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[mid - 1] + sorted[mid]) / 2
		: sorted[mid];
};

export const MedianPresetCard = () => {
	const { counties, stdev } = useCounties();
	const { layer } = route.useParams();
	const search = route.useSearch();
	const navigate = useNavigate();

	const medians = useMemo(
		() => ({
			population: arrayMedian(counties.map((c) => c.population)),
			age: arrayMedian(counties.map((c) => c.medianAge)),
			temperature: arrayMedian(counties.map((c) => c.temperature.avgTempF)),
			homeValue: arrayMedian(counties.map((c) => c.housing.medianHomeValue)),
			rent: arrayMedian(counties.map((c) => c.rent.medianRent)),
		}),
		[counties],
	);

	const ranges = useMemo(
		() => ({
			population: [
				Math.max(
					stdev.population_min,
					medians.population - stdev.population_stdev,
				),
				Math.min(
					stdev.population_max,
					medians.population + stdev.population_stdev,
				),
			] as [number, number],
			age: [
				Math.max(stdev.median_age_min, medians.age - stdev.median_age_stdev),
				Math.min(stdev.median_age_max, medians.age + stdev.median_age_stdev),
			] as [number, number],
			temperature: [
				Math.max(
					stdev.temperature_min,
					medians.temperature - stdev.temperature_stdev,
				),
				Math.min(
					stdev.temperature_max,
					medians.temperature + stdev.temperature_stdev,
				),
			] as [number, number],
			homeValue: [
				Math.max(
					stdev.homeValue_min,
					medians.homeValue - stdev.homeValue_stdev,
				),
				Math.min(
					stdev.homeValue_max,
					medians.homeValue + stdev.homeValue_stdev,
				),
			] as [number, number],
			rent: [
				Math.max(stdev.medianRent_min, medians.rent - stdev.medianRent_stdev),
				Math.min(stdev.medianRent_max, medians.rent + stdev.medianRent_stdev),
			] as [number, number],
		}),
		[medians, stdev],
	);

	const apply = () => {
		navigate({
			to: "/$layer",
			params: { layer: "combined" },
			search: {
				...search,
				population: true,
				age: true,
				temperature: true,
				home_value: true,
				median_rent: true,
				population_min: ranges.population[0],
				population_max: ranges.population[1],
				age_min: ranges.age[0],
				age_max: ranges.age[1],
				temperature_min: ranges.temperature[0],
				temperature_max: ranges.temperature[1],
				home_value_min: ranges.homeValue[0],
				home_value_max: ranges.homeValue[1],
				rent_min: ranges.rent[0],
				rent_max: ranges.rent[1],
			},
		});
	};

	const isActive = layer === "combined";

	return (
		<section className="w-full">
			<div className="rounded-lg border border-violet-300 bg-violet-50/60 p-3">
				<div className="mb-2">
					<h3 className="font-semibold text-gray-900 text-sm">
						Typical County
					</h3>
					<p className="text-gray-500 text-xs">
						Narrow filters around median values — darkest counties are most
						typical, white are most extreme.
					</p>
				</div>

				<div className="mb-3 space-y-1.5">
					<Row
						label="Population"
						value={Math.round(medians.population).toLocaleString()}
						range={`${Math.round(ranges.population[0]).toLocaleString()} – ${Math.round(ranges.population[1]).toLocaleString()}`}
					/>
					<Row
						label="Median Age"
						value={`${Math.round(medians.age)} yrs`}
						range={`${Math.round(ranges.age[0])} – ${Math.round(ranges.age[1])} yrs`}
					/>
					<Row
						label="Temperature"
						value={`${Math.round(medians.temperature)} °F`}
						range={`${Math.round(ranges.temperature[0])} – ${Math.round(ranges.temperature[1])} °F`}
					/>
					<Row
						label="Home Value"
						value={`$${Math.round(medians.homeValue).toLocaleString()}`}
						range={`$${Math.round(ranges.homeValue[0]).toLocaleString()} – $${Math.round(ranges.homeValue[1]).toLocaleString()}`}
					/>
					<Row
						label="Rent"
						value={`$${Math.round(medians.rent).toLocaleString()}`}
						range={`$${Math.round(ranges.rent[0]).toLocaleString()} – $${Math.round(ranges.rent[1]).toLocaleString()}`}
					/>
				</div>

				<button
					type="button"
					onClick={apply}
					className={`w-full rounded-md px-3 py-1.5 text-center font-medium text-xs transition-colors ${
						isActive
							? "bg-violet-600 text-white hover:bg-violet-700"
							: "bg-violet-500 text-white hover:bg-violet-600"
					}`}
				>
					{isActive ? "Apply to map" : "Switch to Combined & apply"}
				</button>
			</div>
		</section>
	);
};

const Row = ({
	label,
	value,
	range,
}: {
	label: string;
	value: string;
	range: string;
}) => (
	<div className="text-xs">
		<div className="flex items-center justify-between">
			<span className="text-gray-500">{label}</span>
			<span className="font-semibold text-gray-800">{value}</span>
		</div>
		<div className="text-right text-gray-400">{range}</div>
	</div>
);
