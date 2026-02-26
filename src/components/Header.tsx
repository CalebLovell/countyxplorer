import { CountySearch } from "~/components/CountySearch";
import { GuideModal } from "~/components/GuideModal";
import { LayerSwitcher } from "~/components/LayerSwitcher";

export const Header = () => {
	return (
		<>
			<header className="flex h-12 w-full items-center justify-between gap-4 bg-gray-50 px-3 py-2">
				<h1 className="shrink-0 font-bold text-base text-gray-900 sm:text-xl">
					USA County Map
				</h1>
				<div className="flex min-w-0 flex-1 items-center justify-center">
					<LayerSwitcher />
					<GuideModal />
				</div>
				<div className="shrink-0">
					<CountySearch />
				</div>
			</header>
			<div className="h-0.5 w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400" />
		</>
	);
};
