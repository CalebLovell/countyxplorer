import * as d3 from "d3";
import type { FeatureCollection, GeometryObject } from "geojson";
import * as React from "react";
import * as topojson from "topojson-client";
import { CountyPath } from "~/components/CountyPath";
import { useAppStore } from "~/data/store";
import { usaCountyGeojson } from "~/data/usaCountyGeojson";

const usaTopoJson = topojson.feature(
	usaCountyGeojson,
	usaCountyGeojson.objects.counties,
) as FeatureCollection;
const path = d3.geoPath();

export const USAMap = () => {
	const svgRef = React.useRef<SVGSVGElement>(null);
	const gRef = React.useRef<SVGGElement>(null);
	const titleId = React.useId();
	const stateBordersId = React.useId();
	const nationBordersId = React.useId();

	// Helper function to handle the topojson mesh type issue
	const createMesh = (
		topology: unknown,
		object: unknown,
		filter?: (a: unknown, b: unknown) => boolean,
	) => {
		return (
			topojson.mesh as (
				topology: unknown,
				object: unknown,
				filter?: unknown,
			) => GeometryObject
		)(topology, object, filter);
	};

	const stateBordersGeometry = createMesh(
		usaCountyGeojson,
		usaCountyGeojson.objects.states,
		(a, b) => a !== b,
	);
	const countryBordersGeometry = createMesh(
		usaCountyGeojson,
		usaCountyGeojson.objects.nation,
	);

	const stateBordersPath = stateBordersGeometry
		? path(stateBordersGeometry)
		: null;
	const countryBordersPath = countryBordersGeometry
		? path(countryBordersGeometry)
		: null;

	const { selectedCounty } = useAppStore();
	const selectedId = selectedCounty?.id;
	const counties = usaTopoJson.features;
	const nonSelected = counties.filter(
		(d) => Number(d.id) !== Number(selectedId),
	);
	const selected = counties.find((d) => Number(d.id) === Number(selectedId));

	return (
		<svg
			ref={svgRef}
			width="100%"
			height="100%"
			viewBox="0 0 960 600"
			aria-labelledby={titleId}
		>
			<title id={titleId}>United States Counties Map</title>
			<g ref={gRef}>
				{nonSelected.map((d) => (
					<CountyPath key={d.id} d={d} path={path(d)} />
				))}
				{selected && (
					<CountyPath key={selected.id} d={selected} path={path(selected)} />
				)}
				<path
					id={stateBordersId}
					d={stateBordersPath || undefined}
					style={{ fill: "none", stroke: "#090821", strokeWidth: "0.7px" }}
				/>
				<path
					id={nationBordersId}
					d={countryBordersPath || undefined}
					style={{ fill: "none", stroke: "#090821", strokeWidth: "0.7px" }}
				/>
			</g>
		</svg>
	);
};
