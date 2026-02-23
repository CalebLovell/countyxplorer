import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { LayerKey } from "~/data/functions";

const route = getRouteApi("/$layer");

type LayerOption = {
	key: "combined" | LayerKey;
	label: string;
};

const layers: LayerOption[] = [
	{ key: "combined", label: "Combined" },
	{ key: "population", label: "Population" },
	{ key: "age", label: "Median Age" },
	{ key: "temperature", label: "Temperature" },
	{ key: "home_value", label: "Home Value" },
	{ key: "median_rent", label: "Rent" },
];

export const LayerSwitcher = () => {
	const { layer } = route.useParams();
	const search = route.useSearch();
	const navigate = useNavigate();

	const setLayer = (key: "combined" | LayerKey) =>
		navigate({ to: "/$layer", params: { layer: key }, search });

	return (
		<div className="flex items-center rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm">
			{layers.map(({ key, label }) => (
				<button
					key={key}
					type="button"
					onClick={() => setLayer(key)}
					className={`rounded-full px-3 py-1 font-medium text-xs transition-colors ${
						layer === key
							? "bg-indigo-600 text-white"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					{label}
				</button>
			))}
		</div>
	);
};
