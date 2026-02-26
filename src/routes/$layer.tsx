import {
	createFileRoute,
	redirect,
	stripSearchParams,
} from "@tanstack/react-router";
import * as React from "react";
import { Toaster } from "sonner";
import { FeedbackButton } from "~/components/FeedbackButton";
import { Header } from "~/components/Header";
import { Key } from "~/components/Key";
import { LeftBar } from "~/components/LeftBar";
import { RightBar } from "~/components/RightBar";
import { ShareButton } from "~/components/ShareButton";
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
	compare: undefined as string | undefined,
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
		compare: typeof search.compare === "string" ? search.compare : undefined,
	}),
	search: {
		middlewares: [stripSearchParams(searchDefaults)],
	},
	loader: () => fetchData(),
	component: App,
});

function App() {
	const counties = Route.useLoaderData();
	const [leftOpen, setLeftOpen] = React.useState(false);
	const [rightOpen, setRightOpen] = React.useState(false);

	return (
		<CountiesProvider counties={counties}>
			<Toaster position="bottom-center" richColors />
			<div className="flex h-dvh flex-col items-center bg-radial-[at_bottom_right] from-red-100 via-orange-100 to-blue-100">
				<Header />
				<main className="relative flex min-h-0 w-full flex-1 items-center">
					{/* Desktop left sidebar */}
					<div className="hidden h-full lg:block">
						<LeftBar />
					</div>

					{/* Map */}
					<div className="relative h-content w-full">
						<USAMap />
						<Key />
						<div className="absolute top-3 right-3">
							<ShareButton />
						</div>
						{/* Mobile toggle buttons */}
						<button
							type="button"
							onClick={() => setLeftOpen(true)}
							className="absolute top-14 left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-indigo-50 lg:hidden"
							aria-label="Open data panel"
						>
							📊
						</button>
						<button
							type="button"
							onClick={() => setRightOpen(true)}
							className="absolute top-14 right-14 flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-colors hover:bg-indigo-50 lg:hidden"
							aria-label="Open filters"
						>
							⚙️
						</button>
					</div>

					{/* Desktop right sidebar */}
					<div className="hidden h-full lg:block">
						<RightBar />
					</div>

					{/* Mobile left drawer */}
					{leftOpen && (
						<>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
							<div
								className="fixed inset-0 z-30 bg-black/40 lg:hidden"
								onClick={() => setLeftOpen(false)}
							/>
							<div className="fixed top-0 left-0 z-40 h-full w-80 overflow-auto bg-white shadow-xl lg:hidden">
								<div className="flex items-center justify-between border-b p-2">
									<span className="font-semibold text-sm">Data</span>
									<button
										type="button"
										onClick={() => setLeftOpen(false)}
										className="rounded p-1 hover:bg-gray-100"
									>
										✕
									</button>
								</div>
								<LeftBar />
							</div>
						</>
					)}

					{/* Mobile right drawer */}
					{rightOpen && (
						<>
							{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop */}
							<div
								className="fixed inset-0 z-30 bg-black/40 lg:hidden"
								onClick={() => setRightOpen(false)}
							/>
							<div className="fixed top-0 right-0 z-40 h-full w-80 overflow-auto bg-white shadow-xl lg:hidden">
								<div className="flex items-center justify-between border-b p-2">
									<span className="font-semibold text-sm">Filters</span>
									<button
										type="button"
										onClick={() => setRightOpen(false)}
										className="rounded p-1 hover:bg-gray-100"
									>
										✕
									</button>
								</div>
								<RightBar />
							</div>
						</>
					)}
				</main>
			</div>
			<FeedbackButton />
		</CountiesProvider>
	);
}
