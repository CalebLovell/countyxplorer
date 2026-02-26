import { getRouteApi } from "@tanstack/react-router";
import * as d3 from "d3";
import type { FeatureCollection, GeometryObject } from "geojson";
import * as React from "react";
import * as topojson from "topojson-client";
import { CountyPath } from "~/components/CountyPath";
import { usaCountyGeojson } from "~/data/usaCountyGeojson";

const route = getRouteApi("/$layer");

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
	const [transform, setTransform] = React.useState<d3.ZoomTransform>(
		d3.zoomIdentity,
	);

	// Set up zoom behavior
	const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);

	React.useEffect(() => {
		if (!svgRef.current || !gRef.current) return;

		const zoom = d3
			.zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 20])
			.on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
				setTransform(event.transform);
			});

		const svgEl = svgRef.current;
		zoomRef.current = zoom;
		d3.select(svgEl).call(zoom);

		return () => {
			d3.select(svgEl).on(".zoom", null);
		};
	}, []);

	const handleZoomIn = React.useCallback(() => {
		if (!svgRef.current || !zoomRef.current) return;
		d3.select(svgRef.current)
			.transition()
			.duration(300)
			.call(zoomRef.current.scaleBy, 2);
	}, []);

	const handleZoomOut = React.useCallback(() => {
		if (!svgRef.current || !zoomRef.current) return;
		d3.select(svgRef.current)
			.transition()
			.duration(300)
			.call(zoomRef.current.scaleBy, 0.5);
	}, []);

	const handleReset = React.useCallback(() => {
		if (!svgRef.current || !zoomRef.current) return;
		d3.select(svgRef.current)
			.transition()
			.duration(500)
			.call(zoomRef.current.transform, d3.zoomIdentity);
	}, []);

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

	const { county: selectedId } = route.useSearch();
	const counties = usaTopoJson.features;
	const nonSelected = counties.filter((d) => Number(d.id) !== selectedId);
	const selected = counties.find((d) => Number(d.id) === selectedId);

	return (
		<div className="relative h-full w-full">
			<svg
				ref={svgRef}
				width="100%"
				height="100%"
				viewBox="0 0 960 640"
				aria-labelledby={titleId}
				className="cursor-grab active:cursor-grabbing"
			>
				<title id={titleId}>United States Counties Map</title>
				<g
					ref={gRef}
					transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
				>
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
			{/* Zoom Controls */}
			<div className="absolute top-3 left-3 flex flex-col gap-1">
				<button
					type="button"
					onClick={handleZoomIn}
					className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 font-bold text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700"
					aria-label="Zoom in"
				>
					+
				</button>
				<button
					type="button"
					onClick={handleZoomOut}
					className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 font-bold text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700"
					aria-label="Zoom out"
				>
					−
				</button>
				<button
					type="button"
					onClick={handleReset}
					className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 text-xs shadow-md backdrop-blur-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700"
					aria-label="Reset zoom"
				>
					⌂
				</button>
			</div>
		</div>
	);
};
