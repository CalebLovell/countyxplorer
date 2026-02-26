import { ComparePanel } from "~/components/ComparePanel";
import { DataPanel } from "~/components/DataPanel";
import { MedianPresetCard } from "~/components/MedianPresetCard";
import { SmartPresets } from "~/components/SmartPresets";
import { SocialsFooter } from "~/components/SocialsFooter";
import { TopMatches } from "~/components/TopMatches";

export const LeftBar = () => {
	return (
		<div className="space-between flex h-full w-full max-w-sm flex-col justify-between space-y-2 divide-y divide-gray-300 overflow-auto p-2 text-right">
			<div className="space-y-2">
				<DataPanel />
				<ComparePanel />
				<TopMatches />
				<MedianPresetCard />
				<SmartPresets />
			</div>
			<SocialsFooter />
		</div>
	);
};
