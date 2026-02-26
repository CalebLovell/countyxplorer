import { CountySearch } from "~/components/CountySearch";
import { GuideModal } from "~/components/GuideModal";
import { LayerSwitcher } from "~/components/LayerSwitcher";

export const Header = () => {
	return (
		<>
			<header className="flex h-12 w-full items-center bg-gray-50 px-3 py-2">
				<h1 className="flex-1 font-bold text-base text-gray-900 sm:text-xl">
					USA County Map
				</h1>
				<div className="flex flex-1 items-center justify-center">
					<LayerSwitcher />
					<GuideModal />
				</div>
				<div className="flex flex-1 justify-end">
					<CountySearch />
				</div>
			</header>
			<div className="h-0.5 w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400" />
		</>
	);
};
