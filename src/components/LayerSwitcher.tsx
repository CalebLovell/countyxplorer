import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { LayerKey } from "~/data/functions";

const route = getRouteApi("/$layer");

type LayerOption = {
	key: "combined" | LayerKey;
	label: string;
	icon: string;
};

const layers: LayerOption[] = [
	{ key: "combined", label: "Combined", icon: "🌎" },
	{ key: "population", label: "Population", icon: "👥" },
	{ key: "age", label: "Age", icon: "🎂" },
	{ key: "temperature", label: "Weather", icon: "☀️" },
	{ key: "home_value", label: "Homes", icon: "🏠" },
	{ key: "median_rent", label: "Rent", icon: "🔑" },
];

export const LayerSwitcher = () => {
	const { layer } = route.useParams();
	const search = route.useSearch();
	const navigate = useNavigate();

	const setLayer = (key: "combined" | LayerKey) =>
		navigate({ to: "/$layer", params: { layer: key }, search });

	return (
		<div className="flex max-w-full items-center overflow-x-auto rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm [&::-webkit-scrollbar]:hidden">
			{layers.map(({ key, label, icon }) => (
				<button
					key={key}
					type="button"
					onClick={() => setLayer(key)}
					className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 font-medium text-xs transition-colors ${
						layer === key
							? "bg-indigo-600 text-white"
							: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
					}`}
				>
					<span>{icon}</span>
					<span>{label}</span>
				</button>
			))}
		</div>
	);
};
