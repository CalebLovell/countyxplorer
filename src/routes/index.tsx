import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Key } from "~/components/Key";
import { Sidebar } from "~/components/Sidebar";
import { USAMap } from "~/components/USAMap";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="flex h-screen flex-col items-center bg-linear-to-br from-green-50 to-blue-50">
			<Header />
			<main className="flex h-full w-full flex-1 items-center justify-center">
				<Sidebar />
				<div className="relative h-full w-full">
					<USAMap />
					<Key />
				</div>
			</main>
		</div>
	);
}
