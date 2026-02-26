import { getRouteApi } from "@tanstack/react-router";
import { type LayerKey, layerColors } from "~/data/functions";

const route = getRouteApi("/$layer");

const layerLabels: Record<LayerKey, string> = {
	population: "Population",
	age: "Median Age",
	temperature: "Temperature",
	home_value: "Home Value",
	median_rent: "Rent",
};

// Combined layer colors (least similar → most similar, light → dark)
const combinedColors = [
	"#ffffff",
	"#FEFFE0",
	"#FEFFCF",
	"#CAE9B5",
	"#85CCBb",
	"#49B7C2",
	"#3280B5",
	"#205274",
	"#173B53",
];

export const Key = () => {
	const { layer } = route.useParams();

	const isCombined = layer === "combined";
	const colors = isCombined ? combinedColors : layerColors[layer as LayerKey];

	const lowLabel = isCombined
		? "Least Similar"
		: `Low ${layerLabels[layer as LayerKey]}`;
	const highLabel = isCombined
		? "Most Similar"
		: `High ${layerLabels[layer as LayerKey]}`;

	return (
		<div className="-translate-x-1/2 absolute bottom-0 left-1/2 z-10 flex items-center space-x-3 whitespace-nowrap rounded-lg bg-slate-300 bg-opacity-80 p-3 backdrop-blur-sm">
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
