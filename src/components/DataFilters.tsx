import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useCounties } from "~/data/CountiesContext";
import { useFilterRanges } from "~/data/useFilterRanges";

const POP_BUCKETS = [0, 10000, 50000, 250000, 1000000, 10000000];
const POP_LABELS = ["0", "10k", "50k", "250k", "1M", "Max"];

const getBucketIndex = (val: number) => {
	let closestIndex = 0;
	let minDiff = Number.POSITIVE_INFINITY;
	for (let i = 0; i < POP_BUCKETS.length; i++) {
		const diff = Math.abs(val - POP_BUCKETS[i]);
		if (diff < minDiff) {
			minDiff = diff;
			closestIndex = i;
		}
	}
	return closestIndex;
};

const route = getRouteApi("/$layer");

export const DataFilters = () => {
	const {
		population,
		age,
		temperature,
		home_value,
		median_rent,
		population_importance,
		age_importance,
		temperature_importance,
		home_value_importance,
		median_rent_importance,
	} = route.useSearch();

	const search = route.useSearch();
	const { layer } = route.useParams();

	const {
		stdev: {
			median_age_min,
			median_age_max,
			temperature_min,
			temperature_max,
			homeValue_min,
			homeValue_max,
			medianRent_min,
			medianRent_max,
		},
	} = useCounties();

	const {
		population_val,
		age_val,
		temperature_val,
		home_value_val,
		median_rent_val,
	} = useFilterRanges();

	const navigate = useNavigate();

	const set = (patch: Record<string, unknown>) =>
		navigate({
			from: "/$layer",
			search: { ...search, ...patch } as typeof search,
		});

	const setRange = (patch: Record<string, unknown>) =>
		navigate({
			from: "/$layer",
			search: { ...search, ...patch } as typeof search,
			replace: true,
		});

	return (
		<section className="relative">
			{layer !== "combined" && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-sm">
					<p className="text-center font-medium text-gray-600 text-sm">
						Switch to <strong>Combined</strong> view
						<br />
						to use filters
					</p>
				</div>
			)}
			<div className="space-y-2">
				{/* Population Filter */}
				<div
					className={`rounded-lg border p-3 transition-all ${population ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">
							Population
						</span>
						<div className="flex items-center gap-2">
							<span className="font-mono text-gray-700 text-xs text-right min-w-[70px]">
								{POP_LABELS[getBucketIndex(population_val[0])]} -{" "}
								{POP_LABELS[getBucketIndex(population_val[1])]}
							</span>
							<button
								type="button"
								onClick={() => set({ population: !population })}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									population ? "bg-indigo-600" : "bg-gray-300"
								}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
										population ? "translate-x-5" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<div className="relative flex h-6 items-center">
								<input
									type="range"
									step={1}
									min={0}
									max={POP_BUCKETS.length - 1}
									value={getBucketIndex(population_val[0])}
									onChange={(e) => {
										const newIndex = Number(e.target.value);
										const maxIndex = getBucketIndex(population_val[1]);
										if (newIndex <= maxIndex) {
											setRange({ population_min: POP_BUCKETS[newIndex] });
										}
									}}
									disabled={!population}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 2 }}
								/>
								<input
									type="range"
									step={1}
									min={0}
									max={POP_BUCKETS.length - 1}
									value={getBucketIndex(population_val[1])}
									onChange={(e) => {
										const newIndex = Number(e.target.value);
										const minIndex = getBucketIndex(population_val[0]);
										if (newIndex >= minIndex) {
											setRange({ population_max: POP_BUCKETS[newIndex] });
										}
									}}
									disabled={!population}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 1 }}
								/>
							</div>
							<div className="relative mt-1 h-4 w-full text-[10px] font-medium text-gray-400">
								{POP_LABELS.map((label, i) => (
									<span
										key={label}
										className="absolute top-0 w-10 -translate-x-1/2 text-center"
										style={{ left: `calc(8px + ${(i / 5) * 100}% - ${(i / 5) * 16}px)` }}
									>
										{label}
									</span>
								))}
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">
								Importance
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={1}
									max={5}
									value={population_importance}
									onChange={(e) =>
										set({ population_importance: Number(e.target.value) })
									}
									disabled={!population}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<span className="w-8 font-semibold text-gray-700 text-xs">
									{population_importance}/5
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Median Age Filter */}
				<div
					className={`rounded-lg border p-3 transition-all ${age ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">
							Median Age
						</span>
						<div className="flex items-center gap-2">
							<span className="font-mono text-gray-700 text-xs">
								{Math.round(age_val[0])} - {Math.round(age_val[1])}yrs
							</span>
							<button
								type="button"
								onClick={() => set({ age: !age })}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									age ? "bg-indigo-600" : "bg-gray-300"
								}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
										age ? "translate-x-5" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<div className="relative flex h-6 items-center">
								<input
									type="range"
									step={1}
									min={median_age_min}
									max={median_age_max}
									value={age_val[0]}
									onChange={(e) => {
										const newMin = Number(e.target.value);
										if (newMin <= age_val[1]) {
											setRange({ age_min: newMin });
										}
									}}
									disabled={!age}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 2 }}
								/>
								<input
									type="range"
									step={1}
									min={median_age_min}
									max={median_age_max}
									value={age_val[1]}
									onChange={(e) => {
										const newMax = Number(e.target.value);
										if (newMax >= age_val[0]) {
											setRange({ age_max: newMax });
										}
									}}
									disabled={!age}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 1 }}
								/>
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">
								Importance
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={1}
									max={5}
									value={age_importance}
									onChange={(e) =>
										set({ age_importance: Number(e.target.value) })
									}
									disabled={!age}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<span className="w-8 font-semibold text-gray-700 text-xs">
									{age_importance}/5
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Temperature Filter */}
				<div
					className={`rounded-lg border p-3 transition-all ${temperature ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">
							Avg. Temperature
						</span>
						<div className="flex items-center gap-2">
							<span className="font-mono text-gray-700 text-xs">
								{Math.round(temperature_val[0])} -{" "}
								{Math.round(temperature_val[1])}°F
							</span>
							<button
								type="button"
								onClick={() => set({ temperature: !temperature })}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									temperature ? "bg-indigo-600" : "bg-gray-300"
								}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
										temperature ? "translate-x-5" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<div className="relative flex h-6 items-center">
								<input
									type="range"
									step={1}
									min={temperature_min}
									max={temperature_max}
									value={temperature_val[0]}
									onChange={(e) => {
										const newMin = Number(e.target.value);
										if (newMin <= temperature_val[1]) {
											setRange({ temperature_min: newMin });
										}
									}}
									disabled={!temperature}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 2 }}
								/>
								<input
									type="range"
									step={1}
									min={temperature_min}
									max={temperature_max}
									value={temperature_val[1]}
									onChange={(e) => {
										const newMax = Number(e.target.value);
										if (newMax >= temperature_val[0]) {
											setRange({ temperature_max: newMax });
										}
									}}
									disabled={!temperature}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 1 }}
								/>
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">
								Importance
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={1}
									max={5}
									value={temperature_importance}
									onChange={(e) =>
										set({ temperature_importance: Number(e.target.value) })
									}
									disabled={!temperature}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<span className="w-8 font-semibold text-gray-700 text-xs">
									{temperature_importance}/5
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Home Value Filter */}
				<div
					className={`rounded-lg border p-3 transition-all ${home_value ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">
							Home Value
						</span>
						<div className="flex items-center gap-2">
							<span className="font-mono text-gray-700 text-xs">
								${home_value_val[0].toLocaleString()} - $
								{home_value_val[1].toLocaleString()}
							</span>
							<button
								type="button"
								onClick={() => set({ home_value: !home_value })}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									home_value ? "bg-indigo-600" : "bg-gray-300"
								}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
										home_value ? "translate-x-5" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<div className="relative flex h-6 items-center">
								<input
									type="range"
									step={Math.round((homeValue_max - homeValue_min) / 100)}
									min={homeValue_min}
									max={homeValue_max}
									value={home_value_val[0]}
									onChange={(e) => {
										const newMin = Number(e.target.value);
										if (newMin <= home_value_val[1]) {
											setRange({ home_value_min: newMin });
										}
									}}
									disabled={!home_value}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 2 }}
								/>
								<input
									type="range"
									step={Math.round((homeValue_max - homeValue_min) / 100)}
									min={homeValue_min}
									max={homeValue_max}
									value={home_value_val[1]}
									onChange={(e) => {
										const newMax = Number(e.target.value);
										if (newMax >= home_value_val[0]) {
											setRange({ home_value_max: newMax });
										}
									}}
									disabled={!home_value}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 1 }}
								/>
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">
								Importance
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={1}
									max={5}
									value={home_value_importance}
									onChange={(e) =>
										set({ home_value_importance: Number(e.target.value) })
									}
									disabled={!home_value}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<span className="w-8 font-semibold text-gray-700 text-xs">
									{home_value_importance}/5
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Median Rent Filter */}
				<div
					className={`rounded-lg border p-3 transition-all ${median_rent ? "border-indigo-400 bg-indigo-50/50" : "border-gray-300 bg-gray-50"}`}
				>
					<div className="mb-2 flex items-center justify-between">
						<span className="font-semibold text-gray-900 text-sm">
							Median Rent
						</span>
						<div className="flex items-center gap-2">
							<span className="font-mono text-gray-700 text-xs">
								${median_rent_val[0].toLocaleString()} - $
								{median_rent_val[1].toLocaleString()}
							</span>
							<button
								type="button"
								onClick={() => set({ median_rent: !median_rent })}
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
									median_rent ? "bg-indigo-600" : "bg-gray-300"
								}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
										median_rent ? "translate-x-5" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
					<div className="mt-3 space-y-3">
						<div>
							<span className="mb-2 block text-gray-600 text-xs">Range</span>
							<div className="relative flex h-6 items-center">
								<input
									type="range"
									step={Math.round((medianRent_max - medianRent_min) / 100)}
									min={medianRent_min}
									max={medianRent_max}
									value={median_rent_val[0]}
									onChange={(e) => {
										const newMin = Number(e.target.value);
										if (newMin <= median_rent_val[1]) {
											setRange({ rent_min: newMin });
										}
									}}
									disabled={!median_rent}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-transparent disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 2 }}
								/>
								<input
									type="range"
									step={Math.round((medianRent_max - medianRent_min) / 100)}
									min={medianRent_min}
									max={medianRent_max}
									value={median_rent_val[1]}
									onChange={(e) => {
										const newMax = Number(e.target.value);
										if (newMax >= median_rent_val[0]) {
											setRange({ rent_max: newMax });
										}
									}}
									disabled={!median_rent}
									className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 disabled:opacity-50 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-indigo-600 disabled:[&::-moz-range-thumb]:cursor-not-allowed [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 disabled:[&::-webkit-slider-thumb]:cursor-not-allowed"
									style={{ zIndex: 1 }}
								/>
							</div>
						</div>
						<div>
							<span className="mb-2 block text-gray-600 text-xs">
								Importance
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={1}
									max={5}
									value={median_rent_importance}
									onChange={(e) =>
										set({ median_rent_importance: Number(e.target.value) })
									}
									disabled={!median_rent}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
								/>
								<span className="w-8 font-semibold text-gray-700 text-xs">
									{median_rent_importance}/5
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
