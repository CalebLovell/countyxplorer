import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { FeedbackButton } from "~/components/FeedbackButton";
import { Header } from "~/components/Header";
import { Key } from "~/components/Key";
import { LayerSwitcher } from "~/components/LayerSwitcher";
import { LeftBar } from "~/components/LeftBar";
import { RightBar } from "~/components/RightBar";
import { USAMap } from "~/components/USAMap";
import { CountiesProvider } from "~/data/CountiesContext";
import { fetchData } from "~/data/fetchData";
import type { LayerKey } from "~/data/functions";

const searchDefaults = {
	feedbackModal: false,
	layer: "combined" as "combined" | LayerKey,
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
};

const clampImportance = (v: unknown) =>
	typeof v === "number" ? Math.min(5, Math.max(1, v)) : 3;

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>) => ({
		feedbackModal: search.feedbackModal === true,
		layer: (
			[
				"combined",
				"population",
				"age",
				"temperature",
				"home_value",
				"median_rent",
			] as const
		).includes(search.layer as "combined" | LayerKey)
			? (search.layer as "combined" | LayerKey)
			: "combined",
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
		county: typeof search.county === "number" ? search.county : null,
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
						<div className="-translate-x-1/2 absolute bottom-3 left-1/2 z-10">
							<LayerSwitcher />
						</div>
					</div>
					<RightBar />
				</main>
			</div>
			<FeedbackButton />
		</CountiesProvider>
	);
}
