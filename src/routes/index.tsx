import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { FeedbackButton } from "~/components/FeedbackButton";
import { Header } from "~/components/Header";
import { Key } from "~/components/Key";
import { LeftBar } from "~/components/LeftBar";
import { RightBar } from "~/components/RightBar";
import { USAMap } from "~/components/USAMap";
import { CountiesProvider } from "~/data/CountiesContext";
import { fetchData } from "~/data/fetchData";

const searchDefaults = {
	feedbackModal: false,
};

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>) => ({
		feedbackModal: search.feedbackModal === true,
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
