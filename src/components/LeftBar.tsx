import { DataPanel } from "~/components/DataPanel";
import { SocialsFooter } from "~/components/SocialsFooter";

export const LeftBar = () => {
	return (
		<div className="space-between flex h-full w-full max-w-sm flex-col justify-between space-y-2 divide-y divide-gray-300 overflow-auto p-2 text-right">
			<DataPanel />
			<SocialsFooter />
		</div>
	);
};
