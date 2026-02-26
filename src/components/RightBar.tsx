import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { DataFilters } from "~/components/DataFilters";
import { searchDefaults } from "~/routes/$layer";

const route = getRouteApi("/$layer");

export const RightBar = () => {
	const search = route.useSearch();
	const navigate = useNavigate();

	const handleReset = () => {
		navigate({
			from: "/$layer",
			search: {
				...searchDefaults,
				county: (search as Record<string, unknown>).county as number | null,
			} as typeof search,
		});
	};

	return (
		<div className="space-between flex h-full w-full max-w-sm flex-col justify-between space-y-2 divide-y divide-gray-300 overflow-auto p-2 text-right">
			<div className="flex justify-end pb-1">
				<button
					type="button"
					onClick={handleReset}
					className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
				>
					↺ Reset Filters
				</button>
			</div>
			<DataFilters />
		</div>
	);
};
