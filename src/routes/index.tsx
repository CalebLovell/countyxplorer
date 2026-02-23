import { createFileRoute, redirect } from "@tanstack/react-router";
import { searchDefaults } from "~/routes/$layer";

export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({
			to: "/$layer",
			params: { layer: "combined" },
			search: searchDefaults,
		});
	},
	component: () => null,
});
