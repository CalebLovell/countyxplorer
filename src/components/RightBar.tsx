import { DataFilters } from "~/components/DataFilters";

export const RightBar = () => {
	return (
		<div className="space-between flex h-full w-full max-w-sm flex-col justify-between space-y-2 divide-y divide-gray-300 overflow-auto p-2 text-right">
			<DataFilters />
		</div>
	);
};
