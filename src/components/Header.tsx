import {
	ArrowRightCircleIcon,
	Bars3BottomLeftIcon,
	CalendarIcon,
} from "@heroicons/react/24/solid";

export const Header = () => {
	return (
		<>
			<header className="flex h-12 w-full items-center justify-between bg-gray-50 p-2">
				<button
					title="Open Menu"
					type="button"
					className="flex transform rounded-md p-2 font-bold text-gray-900 duration-150 ease-in-out hover:bg-gray-200 active:scale-95"
					onClick={() => null}
				>
					<Bars3BottomLeftIcon className="h-6 w-6 text-blue-900" />
					<p className="ml-2 hidden font-semibold md:block">Menu</p>
				</button>
				<div className="flex items-center">
					<button
						title="Pick New Date"
						type="button"
						className="rounded-md p-2 text-blue-900 duration-150 ease-in-out hover:bg-gray-200 active:scale-95"
						onClick={() => null}
					>
						<CalendarIcon className="h-6 w-6" />
					</button>
					<h1 className="text-center font-bold text-base text-gray-900 sm:text-xl">
						USA County Map
					</h1>
				</div>
				<button
					title="Open Slideover"
					type="button"
					className="plausible-event-name=Events flex rounded-md p-2 text-gray-900 transition duration-150 ease-in-out hover:bg-gray-200 active:scale-95"
					onClick={() => null}
				>
					<p className="mr-2 hidden font-semibold md:block">Placeholder</p>
					<ArrowRightCircleIcon className="h-6 w-6 text-blue-900" />
				</button>
			</header>
			<div className="h-0.5 w-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400" />
		</>
	);
};
