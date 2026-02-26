import { getRouteApi, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useCounties } from "~/data/CountiesContext";
import type { FilterValues } from "~/data/functions";
import { getScore } from "~/data/functions";
import { useFilterRanges } from "~/data/useFilterRanges";

const route = getRouteApi("/$layer");

export const TopMatches = () => {
	const { counties, stdev } = useCounties();
	const { layer } = route.useParams();
	const search = route.useSearch();
	const navigate = useNavigate();
	const {
		population,
		age,
		temperature,
		home_value,
		median_rent,
		population_importance,
		age_importance,
		temperature_importance,
		home_value_importance,
		median_rent_importance,
	} = search;
	const {
		population_val,
		age_val,
		temperature_val,
		home_value_val,
		median_rent_val,
	} = useFilterRanges();

	const filterValues: FilterValues = React.useMemo(
		() => ({
			population,
			population_val,
			population_importance,
			median_age: age,
			median_age_val: age_val,
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
		}),
		[
			population,
			population_val,
			population_importance,
			age,
			age_val,
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
		],
	);

	const topMatches = React.useMemo(() => {
		if (layer !== "combined") return [];
		return counties
			.map((c) => ({ county: c, score: getScore(c, filterValues, stdev) }))
			.filter((x) => x.score >= 0)
			.sort((a, b) => a.score - b.score)
			.slice(0, 10);
	}, [counties, filterValues, stdev, layer]);

	if (layer !== "combined" || topMatches.length === 0) return null;

	return (
		<section className="w-full">
			<div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3">
				<h3 className="mb-2 font-semibold text-gray-900 text-sm">
					🏆 Top 10 Matches
				</h3>
				<div className="space-y-1">
					{topMatches.map((match, i) => {
						const pct = Math.max(0, Math.round((1 - match.score / 4) * 100));
						return (
							<button
								key={match.county.id}
								type="button"
								onClick={() =>
									navigate({
										from: "/$layer",
										search: {
											...search,
											county: Number(match.county.id),
										},
									})
								}
								className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-emerald-100"
							>
								<span className="w-5 font-bold text-emerald-700">
									{i + 1}.
								</span>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium text-gray-900">
										{match.county.name}
									</div>
									<div className="text-gray-500" style={{ fontSize: "10px" }}>
										{match.county.state}
									</div>
								</div>
								<span className="shrink-0 rounded-full bg-emerald-200 px-2 py-0.5 font-semibold text-emerald-800 text-xs">
									{pct}%
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</section>
	);
};
