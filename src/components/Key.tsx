import { getRouteApi } from "@tanstack/react-router";
import type { LayerKey } from "~/data/functions";

const route = getRouteApi("/");

const layerLabels: Record<LayerKey, string> = {
	population: "Population",
	age: "Median Age",
	temperature: "Temperature",
	home_value: "Home Value",
	median_rent: "Rent",
};

export const Key = () => {
	const { layer } = route.useSearch();

	const lowLabel =
		layer === "combined"
			? "Least Similar"
			: `Low ${layerLabels[layer as LayerKey]}`;
	const highLabel =
		layer === "combined"
			? "Most Similar"
			: `High ${layerLabels[layer as LayerKey]}`;

	const colors = [
		"#FEFFE0",
		"rgb(254,255,207)",
		"rgb(202,233,181)",
		"rgb(133,204,187)",
		"rgb(73,183,194)",
		"rgb(50,128,181)",
		"#205274",
		"#173B53",
	];

	return (
		<div className="absolute top-2 right-3 flex items-center space-x-3 rounded-lg bg-slate-300 bg-opacity-80 p-3 backdrop-blur-sm">
			<span className="font-semibold text-black text-xs sm:text-sm">
				{lowLabel}
			</span>
			<div className="flex">
				{colors.map((color) => (
					<div
						key={color}
						className="h-4 w-6 transition duration-500 ease-in-out first:rounded-l last:rounded-r sm:h-5 sm:w-8"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>
			<span className="font-semibold text-black text-xs sm:text-sm">
				{highLabel}
			</span>
		</div>
	);
};
