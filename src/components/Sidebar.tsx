import { DataFilters } from "~/components/DataFilters";
import { DataPanel } from "~/components/DataPanel";
import { SocialsFooter } from "~/components/SocialsFooter";

export const Sidebar = () => {
	return (
		<div className="space-between flex h-full w-full max-w-sm flex-col justify-between space-y-2 divide-y divide-gray-300 overflow-auto p-2 text-right">
			<DataFilters />
			<DataPanel />
			<SocialsFooter />
		</div>
	);
};
