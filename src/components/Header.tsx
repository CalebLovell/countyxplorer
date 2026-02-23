import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import { LayerSwitcher } from "~/components/LayerSwitcher";

export const Header = () => {
	return (
		<>
			<header className="flex h-12 w-full items-center bg-gray-50 px-3 py-2">
				<h1 className="flex-1 font-bold text-base text-gray-900 sm:text-xl">
					USA County Map
				</h1>
				<div className="flex flex-1 justify-center">
					<LayerSwitcher />
				</div>
				<div className="flex flex-1 justify-end">
					<button
						title="Open Slideover"
						type="button"
						className="plausible-event-name=Events flex rounded-md p-2 text-gray-900 transition duration-150 ease-in-out hover:bg-gray-200 active:scale-95"
						onClick={() => null}
					>
						<p className="mr-2 hidden font-semibold md:block">Placeholder</p>
						<ArrowRightCircleIcon className="h-6 w-6 text-blue-900" />
					</button>
				</div>
			</header>
			<div className="h-0.5 w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400" />
		</>
	);
};
