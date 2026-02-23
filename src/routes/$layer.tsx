import {
	createFileRoute,
	redirect,
	stripSearchParams,
} from "@tanstack/react-router";
import { FeedbackButton } from "~/components/FeedbackButton";
import { Header } from "~/components/Header";
import { Key } from "~/components/Key";
import { LeftBar } from "~/components/LeftBar";
import { RightBar } from "~/components/RightBar";
import { USAMap } from "~/components/USAMap";
import { CountiesProvider } from "~/data/CountiesContext";
import { fetchData } from "~/data/fetchData";
import type { LayerKey } from "~/data/functions";

const VALID_LAYERS: Array<"combined" | LayerKey> = [
	"combined",
	"population",
	"age",
	"temperature",
	"home_value",
	"median_rent",
];

export const searchDefaults = {
	feedbackModal: false,
	population: true,
	age: true,
	temperature: true,
	home_value: true,
	median_rent: true,
	population_importance: 3,
	age_importance: 3,
	temperature_importance: 3,
	home_value_importance: 3,
	median_rent_importance: 3,
	county: null as number | null,
	population_min: null as number | null,
	population_max: null as number | null,
	age_min: null as number | null,
	age_max: null as number | null,
	temperature_min: null as number | null,
	temperature_max: null as number | null,
	home_value_min: null as number | null,
	home_value_max: null as number | null,
	rent_min: null as number | null,
	rent_max: null as number | null,
};

const clampImportance = (v: unknown) =>
	typeof v === "number" ? Math.min(5, Math.max(1, v)) : 3;

const numOrNull = (v: unknown) => (typeof v === "number" ? v : null);

export const Route = createFileRoute("/$layer")({
	params: {
		parse: (params) => ({ layer: params.layer as "combined" | LayerKey }),
		stringify: (params) => ({ layer: params.layer }),
	},
	beforeLoad: ({ params }) => {
		if (!VALID_LAYERS.includes(params.layer)) {
			throw redirect({
				to: "/$layer",
				params: { layer: "combined" },
				search: searchDefaults,
			});
		}
	},
	validateSearch: (search: Record<string, unknown>) => ({
		feedbackModal: search.feedbackModal === true,
		population: search.population !== false,
		age: search.age !== false,
		temperature: search.temperature !== false,
		home_value: search.home_value !== false,
		median_rent: search.median_rent !== false,
		population_importance: clampImportance(search.population_importance),
		age_importance: clampImportance(search.age_importance),
		temperature_importance: clampImportance(search.temperature_importance),
		home_value_importance: clampImportance(search.home_value_importance),
		median_rent_importance: clampImportance(search.median_rent_importance),
		county: numOrNull(search.county),
		population_min: numOrNull(search.population_min),
		population_max: numOrNull(search.population_max),
		age_min: numOrNull(search.age_min),
		age_max: numOrNull(search.age_max),
		temperature_min: numOrNull(search.temperature_min),
		temperature_max: numOrNull(search.temperature_max),
		home_value_min: numOrNull(search.home_value_min),
		home_value_max: numOrNull(search.home_value_max),
		rent_min: numOrNull(search.rent_min),
		rent_max: numOrNull(search.rent_max),
	}),
	search: {
		middlewares: [stripSearchParams(searchDefaults)],
	},
	loader: () => fetchData(),
	component: App,
});

function App() {
	const counties = Route.useLoaderData();
	return (
		<CountiesProvider counties={counties}>
			<div className="flex h-dvh flex-col items-center bg-radial-[at_bottom_right] from-red-100 via-orange-100 to-blue-100">
				<Header />
				<main className="flex min-h-0 w-full flex-1 items-center">
					<LeftBar />
					<div className="relative h-content w-full">
						<USAMap />
						<Key />
					</div>
					<RightBar />
				</main>
			</div>
			<FeedbackButton />
		</CountiesProvider>
	);
}
