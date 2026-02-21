import { useAppStore } from "~/data/store";

export const Key = () => {
	const { keyIsVisible } = useAppStore();

	const color8 = "#FEFFE0";
	const color7 = "rgb(254,255,207)";
	const color6 = "rgb(202,233,181)";
	const color5 = "rgb(133,204,187)";
	const color4 = "rgb(73,183,194)";
	const color3 = "rgb(50,128,181)";
	const color2 = "#205274";
	const color1 = "#173B53";

	const colors = [
		color8,
		color7,
		color6,
		color5,
		color4,
		color3,
		color2,
		color1,
	];

	if (!keyIsVisible) return null;
	return (
		<div className="absolute top-2 right-3 flex items-center space-x-3 rounded-lg bg-slate-300 bg-opacity-80 p-3 backdrop-blur-sm">
			<span className="font-semibold text-black text-xs sm:text-sm">
				Least Similar
			</span>
			<div className="flex">
				{colors.map((color) => (
					<div
						key={color}
						className="h-4 w-6 transition duration-500 ease-in-out first:rounded-l last:rounded-r sm:h-5 sm:w-8"
						style={{ backgroundColor: color }}
					/>
				))}
			</div>
			<span className="font-semibold text-black text-xs sm:text-sm">
				Most Similar
			</span>
		</div>
	);
};
