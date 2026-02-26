import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import * as React from "react";
import { useCounties } from "~/data/CountiesContext";
import { getActiveCounty, getColor, getLayerColor } from "~/data/functions";
import { useFilterRanges } from "~/data/useFilterRanges";

const route = getRouteApi("/$layer");

type Props = {
	d: Feature<Geometry, GeoJsonProperties>;
	path: string | null;
};

export const CountyPath = React.memo(({ d, path }: Props) => {
	const { counties, stdev } = useCounties();
	const { layer } = route.useParams();
	const search = route.useSearch();
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
		county: selectedCountyId,
	} = search;
	const {
		population_val,
		age_val,
		temperature_val,
		home_value_val,
		median_rent_val,
	} = useFilterRanges();
	const navigate = useNavigate();

	const isSelected = selectedCountyId === Number(d.id);
	const activeCounty = getActiveCounty(Number(d.id), counties);

	const filterValues = {
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
	};

	const color = activeCounty
		? layer === "combined"
			? getColor(activeCounty, filterValues, stdev)
			: getLayerColor(activeCounty, layer, stdev)
		: "#d1d5db";

	const onClick = React.useCallback(() => {
		navigate({
			from: "/$layer",
			search: { ...search, county: isSelected ? null : Number(d.id) },
		});
	}, [navigate, search, isSelected, d.id]);

	const onKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onClick();
			}
		},
		[onClick],
	);

	const countyLabel = activeCounty
		? `${activeCounty.name}, ${activeCounty.state}`
		: undefined;

	const patternId = `diagonalHatch-${d.id}`;
	const filterId = `county-glow-${d.id}`;
	return (
		<>
			{isSelected && (
				<defs>
					<pattern
						id={patternId}
						patternUnits="userSpaceOnUse"
						width="3"
						height="3"
						patternTransform="rotate(45)"
					>
						<rect x="0" y="0" width="3" height="3" fill={color} />
						<line
							x1="0"
							y1="0"
							x2="0"
							y2="3"
							stroke="black"
							strokeWidth="2"
							opacity={0.5}
						/>
					</pattern>
					<filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
						<feDropShadow
							dx="0"
							dy="0"
							stdDeviation="2.5"
							floodColor="black"
							floodOpacity="1"
						/>
					</filter>
				</defs>
			)}
			{/* biome-ignore lint/a11y/useSemanticElements: SVG path cannot be a <button> */}
			<path
				className="cursor-pointer outline-none"
				d={path ? path : undefined}
				fill={isSelected ? `url(#${patternId})` : color}
				stroke="#090821"
				strokeWidth={0.3}
				onClick={onClick}
				onKeyDown={onKeyDown}
				role="button"
				tabIndex={0}
				aria-label={countyLabel}
				filter={isSelected ? `url(#${filterId})` : undefined}
			>
				{countyLabel && <title>{countyLabel}</title>}
			</path>
		</>
	);
});

CountyPath.displayName = "CountyPath";
